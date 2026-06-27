import type { Middleware } from 'grammy'

import type { MyContext } from '@/bot/types/context'

type MediaType = 'photo' | 'video' | 'animation' | 'photo-sticker' | 'video-sticker'

/**
 * Fallback for a generator command invoked without (supported) media: reply with
 * the list of accepted types, then self-destruct after 30s. Ports legacy
 * `no-media-error`.
 */
export function noMediaError(availableTypes: MediaType[]): Middleware<MyContext> {
	return async ctx => {
		const types = availableTypes.map(t => ctx.t(`command-no-media.${t}`)).join(', ')
		const msg = await ctx.reply(ctx.t('command-no-media', { types })).catch(() => undefined)
		if (msg == null) return
		setTimeout(() => {
			void ctx.api.deleteMessage(msg.chat.id, msg.message_id).catch(() => {})
		}, 30 * 1000)
	}
}
