import { type Channel } from '@prisma/client'
import { type Middleware } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

const getChatAdmins = async (ctx: MyContext): Promise<{
  creatorTelegramId: number | undefined
  adminsTelegramIds: number[]
}> => {
  const info = await ctx.getChatAdministrators()

  const creatorTelegramId = info
    .find(m => m.status === 'creator')?.user.id

  const adminsTelegramIds = info
    .filter(m => m.status === 'administrator')
    .map(m => m.user.id)

  return { creatorTelegramId, adminsTelegramIds }
}

const ONE_DAY = 24 * 60 * 60 * 1000
const createChannelGetter = (ctx: MyContext, telegramId: number, title: string) => {
  let fetchedChannel: Channel | null
  return async (forceUpdate = false): Promise<Channel> => {
    if (fetchedChannel != null) return fetchedChannel

    fetchedChannel = await storage.channel.findUnique({
      where: { telegramId }
    })

    const isNewChannel = fetchedChannel == null
    if (fetchedChannel == null || forceUpdate) {
      const { creatorTelegramId, adminsTelegramIds } = await getChatAdmins(ctx)
      fetchedChannel = await storage.channel.upsert({
        where: { telegramId },
        create: { title, telegramId, creatorTelegramId, adminsTelegramIds },
        update: { title, creatorTelegramId, adminsTelegramIds }
      })
    }

    const now = new Date().getTime()
    const updatedAt = fetchedChannel?.updatedAt.getTime()
    /*
    Update the member count in cases:
    1) the update is forced
    2) the channel has just been added to database
    3) more than 24 hours have passed since the last update
    */
    if (isNewChannel || forceUpdate || (updatedAt != null && now - updatedAt > ONE_DAY)) {
      void ctx.getChatMemberCount().then(async (memberCount) => {
        await storage.channel.update({
          where: { telegramId },
          data: { memberCount }
        })
      })
    }

    return fetchedChannel
  }
}

export const setChannel: Middleware<MyContext> = async (ctx, next) => {
  const { chat } = ctx
  if (chat == null || chat.type !== 'channel') {
    ctx.state = { ...ctx.state, channel: undefined }
    await next()
    return
  }

  const { id, title } = chat
  ctx.state = { ...ctx.state, channel: createChannelGetter(ctx, id, title) }

  await next()
}
