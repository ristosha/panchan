import { type User } from '@prisma/client'
import { type NextFunction } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'
import { storage } from '~/storage.js'

type Activity = Partial<Pick<User, 'lastGroupContactedAt' | 'lastPrivateContactedAt'>>

function createUserGetter (telegramId: number, username: string | undefined, activity: Activity) {
  let cachedUser: User | null
  return async (forceUpdate = false) => {
    if (cachedUser != null && !forceUpdate) return cachedUser

    const role = config.BOT_ADMIN_ID === telegramId ? 'ADMIN' : 'USER'
    cachedUser = await storage.user.upsert({
      where: { telegramId },
      update: { username, ...activity },
      create: { telegramId, role, username, ...activity }
    })

    return cachedUser
  }
}

export async function setUser (ctx: MyContext, next: NextFunction) {
  if ((ctx.from == null) || ctx.from.is_bot) return

  const { id: telegramId, username } = ctx.from
  const activity: Activity = {}
  const chatType = ctx.chat?.type

  if (chatType === 'group' || chatType === 'supergroup') {
    activity.lastGroupContactedAt = new Date()
  } else if (chatType === 'private') {
    activity.lastPrivateContactedAt = new Date()
  }

  ctx.state = {
    ...ctx.state,
    data: {},
    user: createUserGetter(telegramId, username, activity)
  }

  await next()
}
