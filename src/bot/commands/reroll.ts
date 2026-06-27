import { type Bot, Composer } from 'grammy'

import { getOriginalMediaByCtx } from '@/bot/helpers/original-media'
import type { MyApi, MyContext } from '@/bot/types/context'

/**
 * `/reroll`: look up the original source of a bot-generated demotivator/text,
 * then re-dispatch it through the matching random command (`/rdemotivator` or
 * `/rtext`) so a fresh random title is applied to the same source media.
 */
export function createReroll(bot: Bot<MyContext, MyApi>): Composer<MyContext> {
	const composer = new Composer<MyContext>()
	const command = composer.command(['reroll', 'реролл', 'рр', 'рерол', 'rr'])

	command.on(['msg:animation', 'msg:photo', 'msg:video', 'msg:video_note']).use(async ctx => {
		const chain = await getOriginalMediaByCtx(ctx)
		if (chain == null) {
			await ctx.reply(ctx.t('command-orig.not-found'))
			return
		}

		const found = chain[0]
		if (found.type !== 'DEMOTIVATOR' && found.type !== 'TEXT') return

		const file = await ctx.api.getFile(found.source_file_id)
		const update = Object.create(ctx.update) as Omit<typeof ctx.update, 'message'> & {
			message: Record<string, unknown>
		}
		const text = `/r${found.type.toLowerCase()}`
		update.message.text = text
		update.message.entities = [{ type: 'bot_command', offset: 0, length: text.length }]
		if (found.mime === 'PHOTO') update.message.photo = [file]
		else update.message[found.mime.toLowerCase()] = file
		;(update as Record<string, unknown>).__redispatched = true

		await bot.handleUpdate(update as unknown as typeof ctx.update)
	})

	return composer
}
