import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { extractId } from './pack-extractors'

const NO_PREVIEW = { link_preview_options: { is_disabled: true } } as const

/** `/promote <packId>` in reply to a user — add them as a pack editor (author only). */
export const promote = new Composer<MyContext>()

promote.command('promote', async ctx => {
	const { id } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply(ctx.t('command-promote.no-pack'))
		return
	}

	const replied = ctx.msg?.reply_to_message?.from
	if (replied?.id == null) {
		await ctx.reply(ctx.t('command-promote.no-user'))
		return
	}

	const userId = (await ctx.state.user()).id
	const pack = await ctx.deps.repos.packs.getOwnPackById(id, userId)
	if (pack == null || pack.authorId !== userId) {
		await ctx.reply(ctx.t('command-promote.empty'))
		return
	}

	const editor = await ctx.deps.repos.users.getByTelegramId(BigInt(replied.id))
	if (editor == null) {
		await ctx.reply(ctx.t('command-promote.user-not-found'))
		return
	}

	if (pack.editors.some(e => e.id === editor.id)) {
		await ctx.reply(ctx.t('command-promote.already'))
		return
	}

	const editors = await ctx.deps.repos.packs.addEditor(id, userId, editor.id)
	if (editors == null) {
		await ctx.reply(ctx.t('command-promote.empty'))
		return
	}

	await ctx.reply(
		ctx.t('command-promote', {
			packId: id,
			name: replied.first_name ?? editor.username ?? ctx.t('anonymous-author'),
			editorCount: editors.length,
			editors: editors
				.map(e =>
					ctx.t('user-link', {
						name: e.username ?? String(e.telegramId),
						id: e.username ?? String(e.telegramId),
					}),
				)
				.join(', '),
		}),
		NO_PREVIEW,
	)
})
