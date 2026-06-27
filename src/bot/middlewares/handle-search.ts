import { Composer } from 'grammy'
import type { InlineQueryResult } from 'grammy/types'

import { parseArgs } from '@/bot/helpers/args'
import type { MyContext } from '@/bot/types/context'
import type { InlineSearchParams } from '@/repositories'

type ElementKind = NonNullable<InlineSearchParams['elementTypes']>[number]
type Mime = 'PHOTO' | 'VIDEO' | 'STICKER' | 'ANIMATION' | 'VIDEO_NOTE'

export const handleSearch = new Composer<MyContext>()

/**
 * Inline search over the user's visible generated media.
 *
 * AUDIT FIXES #2/#6: the heavy query lives in `repos.media.searchInline`, which
 * selects only `mime` + `resultFileId`, uses the FTS index for the russian
 * full-text term, and applies the visibility OR. Here we just parse the query
 * flags and shape the inline answer.
 */
handleSearch.inlineQuery(/.*/, async ctx => {
	const { query, offset: offsetStr } = ctx.inlineQuery

	let offset = Number.parseInt(offsetStr, 10)
	if (Number.isNaN(offset)) offset = 0

	const params: InlineSearchParams = {
		telegramId: BigInt(ctx.inlineQuery.from.id),
		limit: 30,
		offset,
	}

	if (query != null && query.length > 0) {
		const args = parseArgs(query)

		if (args.rtitle === true || args.rmedia === true) {
			const types: ElementKind[] = []
			if (args.rtitle === true) types.push('TEXT')
			if (args.rmedia === true) types.push('PHOTO', 'STICKER', 'ANIMATION', 'VIDEO')
			params.elementTypes = types
		}

		if (args.new === true || args.sortdate === true) params.sortByDate = true
		// admin-only: -all searches across ALL chats (bypasses the visibility filter)
		if (args.all === true && ctx.deps.config.isAdmin(ctx.inlineQuery.from.id)) {
			params.all = true
		}
		if (args._.length > 0) params.term = args._
	}

	const results = await ctx.deps.repos.media.searchInline(params)

	const answer = results
		.map((m, index) => toInlineResult(String(offset + index), m.mime, m.resultFileId))
		.filter((r): r is InlineQueryResult => r != null)

	await ctx.answerInlineQuery(answer, {
		cache_time: 5,
		next_offset: results.length !== 0 ? String(offset + results.length) : undefined,
		is_personal: false,
	})
})

function toInlineResult(id: string, mime: Mime, resultFileId: string): InlineQueryResult | null {
	switch (mime) {
		case 'PHOTO':
			return { id, type: 'photo', photo_file_id: resultFileId }
		case 'ANIMATION':
			return { id, type: 'mpeg4_gif', mpeg4_file_id: resultFileId }
		case 'VIDEO':
			return { id, type: 'video', title: 'Demotivator', video_file_id: resultFileId }
		default:
			return null
	}
}
