import { limit } from '@grammyjs/ratelimiter'

import type { MyContext } from '@/bot/types/context'

/** Generic per-user rate limit shared by the generator commands (2 / 3s). */
export const rateLimit = limit<MyContext, never>({
	timeFrame: 3000,
	limit: 2,
	keyGenerator: ctx => {
		if (ctx.callbackQuery != null) return undefined
		return ctx.from?.id.toString()
	},
	onLimitExceeded: ctx => {
		void ctx.reply(ctx.t('rate-limit'))
	},
})

/** Stricter limit for aware-scale (1 / minute). */
export const awareScaleRateLimit = limit<MyContext, never>({
	timeFrame: 60000,
	limit: 1,
	keyGenerator: ctx => {
		if (ctx.callbackQuery != null) return undefined
		return ctx.from?.id.toString()
	},
	onLimitExceeded: ctx => {
		void ctx.reply(ctx.t('command-aware-scale.rate-limit'))
	},
})
