import { type Chat } from '@prisma/client'
import { type NextFunction } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

const ONE_DAY = 24 * 60 * 60 * 1000

export const packs = {
  defaultPacks: await storage.pack.findMany({
    where: {
      default: true
    },
    select: {
      id: true
    }
  })
}

function createChatGetter (ctx: MyContext, telegramId: number, title: string) {
  let cachedChat: Chat | null
  return async (forceUpdate = false) => {
    if (cachedChat != null && !forceUpdate) return cachedChat

    cachedChat = await storage.chat.upsert({
      where: { telegramId },
      create: {
        title,
        telegramId,
        packs: {
          connect: packs.defaultPacks
        }
      },
      update: {}
    })

    const now = new Date().getTime()
    const updatedAt = cachedChat.updatedAt.getTime()

    /*
    Update the member count in cases:
    1) the update is forced
    2) the chat has just been added to the database (the number of users is not counted, i.e., equal to 0)
    3) more than 24 hours have passed since the last update
     */
    if (forceUpdate || cachedChat?.memberCount === 0 || now - updatedAt > ONE_DAY) {
      void ctx.getChatMemberCount().then(async (memberCount) => {
        await storage.chat.update({
          where: { telegramId },
          data: { title, memberCount }
        })
      })
    }

    return cachedChat
  }
}

export async function setChat (ctx: MyContext, next: NextFunction) {
  const { chat } = ctx
  if (chat == null || chat.type === 'private' || chat.type === 'channel') {
    ctx.state = { ...ctx.state, chat: undefined }
    await next()
    return
  }

  const { id, title } = chat
  ctx.state = { ...ctx.state, chat: createChatGetter(ctx, id, title) }

  await next()
}
