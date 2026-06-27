import { type Bot, Composer } from 'grammy'

import { generalMenu } from '@/bot/layouts'
import { runCommandInPrivate } from '@/bot/middlewares/run-command-in-private'
import type { MyApi, MyContext } from '@/bot/types/context'

/**
 * `/start` & `/restart` entry points. Handles:
 *  1) a `?start=command-<x>` deep link → re-dispatch as `/x` in a private chat,
 *  2) invocation from a group/channel → "continue in DM" button,
 *  3) otherwise → render the shared general menu.
 *
 * NOTE: `/menu` itself is owned by `registerPackHandlers` (it renders the exact
 * same `generalMenu`), so binding `/menu` here too would double-reply — we only
 * take `/start` + `/restart`, which the pack layer does not handle.
 */
export function createMenu(bot: Bot<MyContext, MyApi>): Composer<MyContext> {
	const composer = new Composer<MyContext>()
	const command = composer.command(['start', 'restart'])

	// deep-link: /start command-foo  →  re-dispatch as /foo in private
	command.use(async (ctx, next) => {
		const match = typeof ctx.match === 'string' ? ctx.match : ''
		if (match.startsWith('command-')) {
			const update = Object.create(ctx.update) as Omit<typeof ctx.update, 'message'> & {
				message: Record<string, unknown>
			}
			update.message.chat = { type: 'private', id: ctx.from?.id }
			const text = `/${match.substring('command-'.length)}`
			update.message.text = text
			update.message.entities = [{ type: 'bot_command', offset: 0, length: text.length }]
			;(update as Record<string, unknown>).__redispatched = true
			await bot.handleUpdate(update as unknown as typeof ctx.update)
			return
		}
		await next()
	})

	command.chatType(['group', 'channel', 'supergroup'], runCommandInPrivate('command-menu'))

	command.use(async ctx => {
		await ctx.reply(ctx.t('menu-general'), {
			reply_markup: generalMenu,
			parse_mode: 'Markdown',
			link_preview_options: { is_disabled: true },
		})
	})

	return composer
}
