import { autoRetry } from '@grammyjs/auto-retry'
import { conversations } from '@grammyjs/conversations'
import { hydrateFiles } from '@grammyjs/files'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import { limit } from '@grammyjs/ratelimiter'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { Composer } from 'grammy'

import { i18n } from '~/bot/plugins/i18n.js'
import { sessions } from '~/bot/plugins/sessions.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export const plugins = new Composer<MyContext>()

plugins.use(hydrate())
plugins.use(hydrateReply)
plugins.use(sessions)
plugins.use(i18n)

plugins.use(limit({
  timeFrame: 3000,
  limit: 2,
  keyGenerator: (ctx) => {
    if (ctx.callbackQuery != null) return undefined
    return ctx.from?.id.toString()
  },
  onLimitExceeded: (ctx) => {
    void ctx.reply(ctx.t('rate-limit'))
  }
}))

plugins.use(conversations())

const throttler = apiThrottler()
const retry = autoRetry()

plugins.use(async (ctx, next) => {
  ctx.api.config.use(throttler)
  ctx.api.config.use(retry)
  ctx.api.config.use(hydrateFiles(config.BOT_TOKEN))
  ctx.api.config.use(parseMode('Markdown'))
  await next()
})
