import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

export const premium = new Composer<MyContext>()

premium
	.command('premium')
	.filter(ctx => ctx.msg?.reply_to_message != null)
	.use(async ctx => {
		const userId = ctx.msg.reply_to_message?.from?.id
		if (userId == null) {
			await ctx.reply('Undefined user id')
			return
		}

		const user = await ctx.deps.repos.users.getByTelegramId(BigInt(userId))
		if (user == null) {
			await ctx.reply('User has no interactions with the bot')
			return
		}

		await ctx.deps.repos.users.setPremium(user.id, !user.premium)
		await ctx.reply(`Premium is \`${String(!user.premium)}\` now`)
	})
