import { Composer } from 'grammy'

import { extractMediaExtended } from '@/bot/helpers/extractors'
import type { MyContext } from '@/bot/types/context'

export const handleUsage = new Composer<MyContext>()

/**
 * Record that a piece of bot-generated media was (re)posted. Runs on every
 * photo/video/animation message.
 *
 * AUDIT FIXES #1/#2: uses the indexed `findIdByResultFileUniqueId` lookup
 * (selecting only the id) instead of a `findFirst` seq-scan returning the whole
 * row, and inserts the use via the dedicated `recordUse` helper.
 */
handleUsage.on(['msg:photo', 'msg:video', 'msg:animation']).use(async (ctx, next) => {
	if (ctx.from == null || ctx.from.is_bot) {
		await next()
		return
	}

	const { uniqueFileId } = extractMediaExtended(ctx)
	if (uniqueFileId == null) {
		await next()
		return
	}

	const media = await ctx.deps.repos.media.findIdByResultFileUniqueId(uniqueFileId)
	if (media == null) {
		await next()
		return
	}

	const chatId = ctx.state.chat != null ? (await ctx.state.chat()).id : null
	await ctx.deps.repos.media.recordUse(media.id, chatId, BigInt(ctx.from.id))

	await next()
})
