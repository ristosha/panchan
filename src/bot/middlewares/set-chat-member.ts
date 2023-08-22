import { type ChatMember, ChatMemberRole } from '@prisma/client'
import { type NextFunction } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

const roleMap: Record<string, ChatMemberRole> = {
  creator: ChatMemberRole.CREATOR,
  administrator: ChatMemberRole.ADMIN,
  member: ChatMemberRole.MEMBER,
  restricted: ChatMemberRole.MEMBER
}

export class ChatMemberRemoved extends Error {
  constructor () {
    super('Requested member was removed from the chat')
  }
}

function createChatMemberGetter (ctx: MyContext, telegramId: number) {
  let cachedChatMember: ChatMember | null
  return async (forceUpdate = false) => {
    if (cachedChatMember != null && !forceUpdate) return cachedChatMember

    const { id: userId } = await ctx.state.user()
    // @ts-expect-error checked before
    const { id: chatId } = await ctx.state.chat()

    cachedChatMember = await storage.chatMember.findUnique({
      where: { userId_chatId: { userId, chatId } }
    })

    if (cachedChatMember == null || forceUpdate) {
      const { status } = await ctx.getChatMember(telegramId)
      if (['left', 'kicked'].includes(status)) {
        if (cachedChatMember != null) {
          await storage.chatMember.delete({ where: { id: cachedChatMember.id } })
        }

        throw new ChatMemberRemoved()
      }

      const role = roleMap[status]

      cachedChatMember = await storage.chatMember.upsert({
        where: { userId_chatId: { userId, chatId } },
        create: { userId, chatId, role },
        update: { role }
      })
    }

    return cachedChatMember
  }
}

export async function setChatMember (ctx: MyContext, next: NextFunction) {
  if (ctx.from == null || ctx.state.chat == null) {
    ctx.state = { ...ctx.state, chatMember: undefined }
    await next()
    return
  }

  ctx.state = {
    ...ctx.state,
    chatMember: createChatMemberGetter(ctx, ctx.from.id)
  }

  await next()
}
