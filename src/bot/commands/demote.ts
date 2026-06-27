import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { extractId } from './pack-extractors'

const NO_PREVIEW = { link_preview_options: { is_disabled: true } } as const

/** `/demote <packId>` in reply to a user — remove them as a pack editor (author only). */
export const demote = new Composer<MyContext>()

demote.command('demote', async ctx => {
	const { id } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply(ctx.t('command-demote.no-pack'))
		return
	}

	const replied = ctx.msg?.reply_to_message?.from
	if (replied?.id == null) {
		await ctx.reply(ctx.t('command-demote.no-user'))
		return
	}

	const userId = (await ctx.state.user()).id
	const pack = await ctx.deps.repos.packs.getOwnPackById(id, userId)
	if (pack == null || pack.authorId !== userId) {
		await ctx.reply(ctx.t('command-demote.empty'))
		return
	}

	const editor = await ctx.deps.repos.users.getByTelegramId(BigInt(replied.id))
	if (editor == null) {
		await ctx.reply(ctx.t('command-demote.user-not-found'))
		return
	}

	if (!pack.editors.some(e => e.id === editor.id)) {
		await ctx.reply(ctx.t('command-demote.already'))
		return
	}

	const editors = await ctx.deps.repos.packs.removeEditor(id, userId, editor.id)
	if (editors == null) {
		await ctx.reply(ctx.t('command-demote.empty'))
		return
	}

	await ctx.reply(
		ctx.t('command-demote', {
			packId: id,
			name: replied.first_name ?? editor.username ?? ctx.t('anonymous-author'),
			editorCount: editors.length,
			editors: editors
				.map(e =>
					ctx.t('user-link', {
						name: e.username ?? ctx.t('anonymous-author'),
						id: String(e.telegramId),
					}),
				)
				.join(', '),
		}),
		NO_PREVIEW,
	)
})
