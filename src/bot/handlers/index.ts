import type { Bot } from 'grammy'

import { admin } from '@/bot/commands/admin'
import { generators } from '@/bot/commands/generators'
import { createMenu } from '@/bot/commands/menu'
import { orig } from '@/bot/commands/orig'
import { createRandomCommand } from '@/bot/commands/random'
import { createReroll } from '@/bot/commands/reroll'
import { reset } from '@/bot/commands/reset'
import { captionFix } from '@/bot/middlewares/caption-fix'
import { handleSearch } from '@/bot/middlewares/handle-search'
import { handleUsage } from '@/bot/middlewares/handle-usage'
import { memberUpdate } from '@/bot/middlewares/member-update'
import { nonEnglishCommands } from '@/bot/middlewares/non-english-commands'
import { replyMediaMerge } from '@/bot/middlewares/reply-media-merge'
import { stateMiddleware } from '@/bot/middlewares/state'
import type { MyApi, MyContext } from '@/bot/types/context'
import type { Container } from '@/container'

import { registerPackHandlers } from './packs'

/**
 * Install the entire bot handler stack onto `bot` (deps / session / i18n /
 * conversations are already attached by `createBot`). Order matters: the State
 * middleware fills `ctx.state` for everything downstream, then the cross-cutting
 * middlewares, then commands, then the pack/menu layouts.
 */
export function registerHandlers(bot: Bot<MyContext, MyApi>, container: Container): void {
	// 1) per-update entity getters (user/chat/chatMember/channel)
	bot.use(stateMiddleware)

	// 2) cross-cutting middlewares
	bot.use(captionFix)
	bot.use(memberUpdate)
	bot.use(handleUsage)
	bot.use(replyMediaMerge)
	bot.use(nonEnglishCommands)
	bot.use(handleSearch)

	// 3) commands
	bot.use(createMenu(bot))
	bot.use(generators)
	bot.use(
		createRandomCommand(bot, {
			aliases: ['rdem', 'rdemotivator', 'рдем', 'рандом'],
			target: 'dem',
		}),
	)
	bot.use(
		createRandomCommand(bot, {
			aliases: ['rlobster', 'rtext', 'рлобстер'],
			target: 'lobster',
			titleMaxLines: 1,
		}),
	)
	bot.use(orig)
	bot.use(createReroll(bot))
	bot.use(reset)
	bot.use(admin)

	// 4) pack + menu layouts (written by another agent)
	registerPackHandlers(bot, container)
}
