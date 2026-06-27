import { autoRetry } from '@grammyjs/auto-retry'
import { conversations } from '@grammyjs/conversations'
import { hydrateFiles } from '@grammyjs/files'
import { hydrate } from '@grammyjs/hydrate'
import { hydrateReply, parseMode } from '@grammyjs/parse-mode'
import { sequentialize } from '@grammyjs/runner'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { Bot, InputFile, type Middleware } from 'grammy'

import type { MyApi, MyContext } from '@/bot/types/context'
import type { Container } from '@/container'

import { registerHandlers } from './handlers'
import { i18n } from './plugins/i18n'
import { createSessionPlugin } from './plugins/session'

const STALE_UPDATE_SECONDS = 5 * 60

export function createBot(container: Container): Bot<MyContext, MyApi> {
	const { config, logger } = container
	const bot = new Bot<MyContext, MyApi>(config.BOT_TOKEN)

	// API transformers installed ONCE at startup. The legacy code re-ran these
	// `.use()` calls inside a per-update middleware on the shared `bot.api`,
	// growing the transformer stack unboundedly (memory + CPU leak — the bot got
	// slower the longer it ran).
	bot.api.config.use(apiThrottler())
	bot.api.config.use(autoRetry())
	bot.api.config.use(hydrateFiles(config.BOT_TOKEN))
	bot.api.config.use(parseMode('Markdown'))

	bot.catch(async err => {
		logger.error({ err: err.error, message: err.message }, 'bot error')
		const ctx = err.ctx
		try {
			await ctx.reply(ctx.t('bot-error')).catch(() => {})
			if (config.BOT_LOG_CHAT_ID != null) {
				// log only the update, never the whole ctx (which carries the token)
				const dump = JSON.stringify(ctx.update, null, 2)
				await ctx.api.sendDocument(
					config.BOT_LOG_CHAT_ID,
					new InputFile(Buffer.from(dump), 'update.json'),
					{ caption: `\`${err.message.substring(0, 512)}\`` },
				)
			}
		} catch (e) {
			logger.error({ err: e }, 'failed to report error')
		}
	})

	// sequentialize per chat so same-chat updates don't race the session
	// read-modify-write; must run before session/handlers.
	bot.use(
		sequentialize(ctx => {
			// re-dispatched synthetic updates (rdem/reroll/deep-link) run INSIDE a parent
			// update via bot.handleUpdate — they must NOT re-enter the same-chat queue, or
			// they deadlock the in-flight parent (parent awaits child, child awaits queue).
			if ((ctx.update as unknown as Record<string, unknown>).__redispatched === true)
				return undefined
			return ctx.chat?.id.toString()
		}),
	)

	// drop stale updates before any DB/plugin work
	bot.use(async (ctx, next) => {
		const date = ctx.msg?.date
		if (date !== undefined && Date.now() / 1000 - date > STALE_UPDATE_SECONDS) return
		await next()
	})

	bot.use(hydrate())
	bot.use(hydrateReply as Middleware<MyContext>)

	// attach long-lived dependencies to every context
	bot.use(async (ctx, next) => {
		ctx.deps = container
		await next()
	})

	bot.use(createSessionPlugin(container))
	bot.use(i18n)
	bot.use(conversations())

	registerHandlers(bot, container)

	return bot
}
