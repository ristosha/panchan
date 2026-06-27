import type { Repositories } from '@/repositories'

type ElementKind = 'TEXT' | 'PHOTO' | 'VIDEO' | 'STICKER' | 'ANIMATION'

const TYPE_MAP: Record<'titles' | 'media', ElementKind[]> = {
	titles: ['TEXT'],
	media: ['VIDEO', 'ANIMATION', 'PHOTO'],
}

function countLines(str: string): number {
	return str.split('\n').length
}

/**
 * Pick a random pack element of the given kind, scoped to a chat's enabled packs
 * (or the default packs when no chat). For titles a `maxLines` cap can be given
 * and a few re-rolls are attempted to satisfy it.
 *
 * AUDIT FIX #3: the heavy lifting (single `ORDER BY random() LIMIT 1`) lives in
 * `repos.packElements.getRandom`; this only adds the titles line-count re-roll.
 */
export async function getRandomElement(
	repos: Repositories,
	type: 'titles' | 'media',
	chatId?: number,
	maxLines?: number,
	tries = 0,
): Promise<{ id: number; type: ElementKind; content: string } | null> {
	const element = await repos.packElements.getRandom(TYPE_MAP[type], chatId)
	if (element == null) return null

	if (maxLines != null && type === 'titles' && countLines(element.content) > maxLines) {
		if (tries > 5) return null
		return getRandomElement(repos, type, chatId, maxLines, tries + 1)
	}

	return element
}
