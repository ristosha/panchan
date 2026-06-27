import type { MiddlewareFn } from 'grammy'

import type { MyContext } from '@/bot/types/context'

const MEDIA_KEYS = ['photo', 'video', 'document', 'animation', 'sticker', 'video_note'] as const

/**
 * When a command is sent as a reply to a media message but carries no media
 * itself, copy the replied-to media onto the current message so generators can
 * operate on it. Ports legacy `reply-media-merge`.
 */
export const replyMediaMerge: MiddlewareFn<MyContext> = async (ctx, next) => {
	const reply = ctx.msg?.reply_to_message
	if (reply != null) {
		const msg = ctx.msg as unknown as Record<string, unknown>
		const src = reply as unknown as Record<string, unknown>
		for (const key of MEDIA_KEYS) {
			if (key in src && msg[key] == null) {
				msg[key] = src[key]
			}
		}
	}
	await next()
}
