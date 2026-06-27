import type { MyContext } from '@/bot/types/context'

export type PackElementKind = 'TEXT' | 'PHOTO' | 'VIDEO' | 'STICKER' | 'ANIMATION'

/**
 * Parse `<id> <content...>` out of a command's argument string (`ctx.match`).
 * Pack-scoped helper (the generic `extractId` lived in legacy helpers/extractors).
 */
export function extractId(ctx: MyContext): { id: number; content: string } {
	const raw = (typeof ctx.match === 'string' ? ctx.match : '').trim()
	const split = raw.length > 0 ? raw.split(/\s+/) : []
	const id = Number.parseInt(split[0] ?? '', 10)
	const content = split.slice(1).join(' ').substring(0, 300)
	return { id, content }
}

/** Pull a media file id + element type off the current message. */
export function extractMedia(ctx: MyContext): {
	fileId: string | undefined
	type: PackElementKind
} {
	if (ctx.msg?.animation != null) {
		return { fileId: ctx.msg.animation.file_id, type: 'ANIMATION' }
	}
	if (ctx.msg?.video != null) {
		return { fileId: ctx.msg.video.file_id, type: 'VIDEO' }
	}
	if (ctx.msg?.photo != null) {
		return { fileId: ctx.msg.photo.at(-1)?.file_id, type: 'PHOTO' }
	}
	return { fileId: undefined, type: 'PHOTO' }
}
