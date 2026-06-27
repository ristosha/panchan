import { InlineKeyboard, type Middleware } from 'grammy'

import type { MyContext } from '@/bot/types/context'

/**
 * Guard for commands that only make sense in a private chat. In a group it
 * replies with a deep-link button to continue in DMs (passing the command via
 * `?start=`). Ports legacy `run-command-in-private`.
 */
export function runCommandInPrivate(command: string): Middleware<MyContext> {
	return async ctx => {
		const keyboard = new InlineKeyboard().url(
			ctx.t('command-no-private.go'),
			`https://t.me/${ctx.me.username}?start=${command}`,
		)
		await ctx.reply(ctx.t('command-no-private'), { reply_markup: keyboard })
	}
}
