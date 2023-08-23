import { limit } from '@grammyjs/ratelimiter'

import { type MyContext } from '~/bot/types/context.js'

export const rateLimit = limit<MyContext, any>({
  timeFrame: 3000,
  limit: 2,
  keyGenerator: (ctx) => {
    if (ctx.callbackQuery != null) return undefined
    return ctx.from?.id.toString()
  },
  onLimitExceeded: (ctx) => {
    void ctx.reply(ctx.t('rate-limit'))
  }
})
