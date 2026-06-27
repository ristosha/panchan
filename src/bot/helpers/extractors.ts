import type { Message } from 'grammy/types'

import type { MyContext } from '@/bot/types/context'

export type ElementType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'STICKER' | 'ANIMATION'

export function extractMatch(ctx: MyContext): string | null {
	if (ctx.callbackQuery?.data != null) return ctx.callbackQuery.data
	if (typeof ctx.match === 'string' && ctx.match.length > 0) return ctx.match
	if (ctx.match != null) return ctx.match[0] ?? null
	return null
}

/** Parse a leading numeric id + trailing content from a command/message body. */
export function extractId(ctx: MyContext): { id: number; content: string } {
	const content =
		(typeof ctx.match === 'string' ? ctx.match : null) ?? ctx.msg?.caption ?? ctx.msg?.text ?? ''
	const split = content.split(' ')
	const sliceId = content.startsWith('/') ? 1 : 0
	const rawId = split[sliceId]
	return { id: Number.parseInt(rawId, 10), content: split.slice(sliceId + 1, 300).join(' ') }
}

export function extractMedia(ctx: MyContext): { fileId: string | undefined; type: ElementType } {
	let fileId: string | undefined
	let type: ElementType = 'PHOTO'
	if (ctx.msg?.animation != null) {
		fileId = ctx.msg.animation.file_id
		type = 'ANIMATION'
	} else if (ctx.msg?.video != null) {
		fileId = ctx.msg.video.file_id
		type = 'VIDEO'
	} else if (ctx.msg?.photo != null) {
		fileId = ctx.msg.photo.at(-1)?.file_id
		type = 'PHOTO'
	}
	return { fileId, type }
}

export function extractMediaExtended(ctx: MyContext): {
	fileId: string | undefined
	uniqueFileId: string | undefined
	isVideo: boolean | undefined
	type: ElementType
} {
	let fileId: string | undefined
	let uniqueFileId: string | undefined
	let isVideo: boolean | undefined
	let type: ElementType = 'PHOTO'

	if (ctx.msg?.animation != null) {
		fileId = ctx.msg.animation.file_id
		uniqueFileId = ctx.msg.animation.file_unique_id
		type = 'ANIMATION'
	} else if (ctx.msg?.video != null) {
		fileId = ctx.msg.video.file_id
		uniqueFileId = ctx.msg.video.file_unique_id
		type = 'VIDEO'
	} else if (ctx.msg?.photo != null) {
		fileId = ctx.msg.photo.at(-1)?.file_id
		uniqueFileId = ctx.msg.photo.at(-1)?.file_unique_id
		type = 'PHOTO'
	} else if (ctx.msg?.sticker != null) {
		fileId = ctx.msg.sticker.file_id
		uniqueFileId = ctx.msg.sticker.file_unique_id
		type = 'STICKER'
		isVideo = ctx.msg.sticker.is_video
	} else if (ctx.msg?.video_note != null) {
		fileId = ctx.msg.video_note.file_id
		uniqueFileId = ctx.msg.video_note.file_unique_id
	}

	return { fileId, type, uniqueFileId, isVideo }
}

/** Pull the result file ids from a freshly-sent animation/video message. */
export function getAnimationOrVideoId(message: Message): {
	resultFileId: string
	resultFileUniqueId: string
} {
	if (message.animation != null) {
		return {
			resultFileId: message.animation.file_id,
			resultFileUniqueId: message.animation.file_unique_id,
		}
	}
	if (message.video != null) {
		return {
			resultFileId: message.video.file_id,
			resultFileUniqueId: message.video.file_unique_id,
		}
	}
	throw new Error('no media in sent message')
}

/** Pull the result file ids from a freshly-sent photo message (largest size). */
export function getPhotoId(message: Message): { resultFileId: string; resultFileUniqueId: string } {
	const photo = message.photo
	if (photo == null || photo.length === 0) throw new Error('no photo in sent message')
	const largest = photo[photo.length - 1]
	return { resultFileId: largest.file_id, resultFileUniqueId: largest.file_unique_id }
}
