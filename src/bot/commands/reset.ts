import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

export const reset = new Composer<MyContext>()

reset.command('reset_keyboard', async ctx => {
	await ctx.reply('Reset!', { reply_markup: { remove_keyboard: true } })
})
