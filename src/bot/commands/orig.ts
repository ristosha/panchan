import { Composer, InlineKeyboard } from 'grammy'
import type { Message } from 'grammy/types'

import { getOriginalMediaByCtx, getOriginalMediaById } from '@/bot/helpers/original-media'
import type { MyContext } from '@/bot/types/context'
import type { MediaChainElement } from '@/repositories'

export const orig = new Composer<MyContext>()

const pattern = /orig(?:\/id:(?<rawId>\d+)|)\/userId:(?<rawUserId>\d+)(?:\/first:(?<rawFirst>\d+)|)/

orig.callbackQuery('orig/dummy', async ctx => {
	await ctx.answerCallbackQuery()
})

orig.callbackQuery(pattern, async ctx => {
	const match = ctx.match as RegExpMatchArray
	const { rawId, rawFirst, rawUserId } = match.groups ?? {}
	const userId = Number(rawUserId)

	const { message } = ctx.callbackQuery
	if (message != null) {
		const { type } = message.chat
		if (type !== 'private' && userId !== ctx.from.id) {
			await ctx.answerCallbackQuery()
			return
		}
	}

	const id = rawId != null ? Number(rawId) : undefined
	const first = rawFirst != null ? Number(rawFirst) : undefined
	await ctx.answerCallbackQuery()
	await handleOrig({ ctx, id, first, message })
})

const command = orig.command(['original', 'orig', 'ориг'])
command.on(['msg:animation', 'msg:photo', 'msg:video', 'msg:video_note']).use(async ctx => {
	await handleOrig({ ctx })
})

interface HandleOrigParams {
	ctx: MyContext
	id?: number
	first?: number
	message?: Message
}

async function handleOrig({ ctx, id, first, message }: HandleOrigParams): Promise<void> {
	const chain = id != null ? await getOriginalMediaById(ctx, id) : await getOriginalMediaByCtx(ctx)

	if (chain == null || chain.length === 0) {
		await ctx.reply(ctx.t('command-orig.not-found'))
		return
	}

	if (message != null) {
		if (message.reply_to_message?.from?.id === ctx.me.id) {
			const reply = message.reply_to_message
			await ctx.api.deleteMessage(reply.chat.id, reply.message_id).catch(() => {})
		}
		await ctx.api.deleteMessage(message.chat.id, message.message_id).catch(() => {})
	}

	if (chain.length === 1) {
		await sendOrigResult({ ctx, ...chain[0] })
		return
	}

	const keyboard = new InlineKeyboard()
	keyboard.text(
		ctx.t('command-orig.restricted', {
			author: ctx.from?.first_name ?? ctx.from?.username ?? '??',
		}),
		'orig/dummy',
	)
	keyboard.row()

	if (first != null && first !== id) {
		keyboard.text('🏠', `orig/id:${first}/userId:${ctx.from?.id ?? 0}/first:${first}`)
	}

	const firstId = first ?? chain[0].id
	keyboard.text('➡️', `orig/id:${chain[1].id}/userId:${ctx.from?.id ?? 0}/first:${firstId}`)
	keyboard.text('⏩', `orig/id:${chain[chain.length - 1].id}/userId:${ctx.from?.id ?? 0}`)

	await sendOrigResult({ ctx, keyboard, ...chain[0], remainingMedia: chain.length - 1 })
}

interface OrigResultParams extends MediaChainElement {
	ctx: MyContext
	remainingMedia?: number
	keyboard?: InlineKeyboard
}

export async function sendOrigResult(params: OrigResultParams): Promise<void> {
	const {
		ctx,
		type,
		mime,
		meta,
		a_anonymous: anonymous,
		a_username: username,
		use_count: useCount,
		source_file_id: sourceFileId,
		created_at: createdAt,
		remainingMedia = 0,
		keyboard: reply_markup,
	} = params

	const author = username != null && !anonymous ? username : ctx.t('anonymous-author')

	const context: Record<string, unknown> = { author, createdAt, useCount: Number(useCount) }
	if (remainingMedia > 0) context.remainingMedia = remainingMedia

	const commandName = type.toLowerCase().replaceAll('_', '-')

	const args = Object.entries(meta ?? {})
		.filter(([k]) => k !== '_')
		.map(([k, v]) => `-${k}=${String(v)}`)
		.join('\n')

	const caption =
		ctx.t('command-orig', context as Record<string, string | number>) +
		`\n\n${ctx.t('command-orig.command', { command: commandName })}` +
		(Object.keys(meta ?? {}).length > 0 ? `\n\n${ctx.t('command-orig.args', { args })}` : '') +
		(remainingMedia > 0
			? `\n\n${ctx.t('command-orig.chained', context as Record<string, string | number>)}`
			: '')

	const linkPreview = { link_preview_options: { is_disabled: true } } as const

	switch (mime) {
		case 'ANIMATION':
			await ctx.replyWithAnimation(sourceFileId, { caption, reply_markup })
			break
		case 'VIDEO':
			await ctx.replyWithVideo(sourceFileId, { caption, reply_markup })
			break
		case 'PHOTO':
			await ctx.replyWithPhoto(sourceFileId, { caption, reply_markup })
			break
		case 'STICKER': {
			const sticker = await ctx.replyWithSticker(sourceFileId)
			await ctx.reply(caption, {
				reply_markup,
				reply_parameters: { message_id: sticker.message_id },
				...linkPreview,
			})
			break
		}
		case 'VIDEO_NOTE': {
			const note = await ctx.replyWithVideoNote(sourceFileId)
			await ctx.reply(caption, {
				reply_markup,
				reply_parameters: { message_id: note.message_id },
				...linkPreview,
			})
			break
		}
		default:
			break
	}
}
