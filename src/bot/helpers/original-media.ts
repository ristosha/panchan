import { basename } from 'node:path'

import type { MyContext } from '@/bot/types/context'
import type { MediaChainElement } from '@/repositories'

/**
 * Resolve the media "chain" (recursive walk of source -> result links) for the
 * media in the current message. Ports legacy `getOriginalMediaByCtx`.
 */
export async function getOriginalMediaByCtx(ctx: MyContext): Promise<MediaChainElement[] | null> {
	const file = await ctx.getFile()
	const resultFileUniqueId = file.file_unique_id
	const filename = basename(file.file_path ?? '')

	let publicId: string | undefined
	const { BOT_FILE_PREFIX } = ctx.deps.config
	if (filename.startsWith(BOT_FILE_PREFIX)) {
		// legacy parity: pull the segment after the prefix
		publicId = filename.slice(BOT_FILE_PREFIX.length).split('.').at(1)
	}

	const found = await ctx.deps.repos.media.findSourceFileIdForOriginal(resultFileUniqueId, publicId)
	if (found == null) return null

	return ctx.deps.repos.media.getMediaChain(found.sourceFileId)
}

/** Resolve the media chain seeded by an internal media id. */
export async function getOriginalMediaById(
	ctx: MyContext,
	id: number,
): Promise<MediaChainElement[] | null> {
	const chain = await ctx.deps.repos.media.getMediaChainById(id)
	return chain.length > 0 ? chain : null
}
