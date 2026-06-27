import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { CHATS_PER_PAGE, openPack } from './shared'
import { packState } from './state'

/**
 * Enable/disable the current pack in the chats the user administrates. The
 * admin/creator guard lives in `repos.chats.setPackEnabled`, which returns false
 * when the user isn't allowed. Replaces legacy `packs/install-chat-list`.
 */
export const installChatsMenu = new Menu<MyContext>('pack-install')

installChatsMenu
	.url(
		ctx => ctx.t('menu-chat-list-button.invite-bot'),
		ctx => `https://t.me/${ctx.me.username}?startgroup=force_update_chat`,
	)
	.row()

installChatsMenu.dynamic(async (ctx, range) => {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id
	const packId = state.packId ?? -1

	const chats = await ctx.deps.repos.chats.getOwnWithPacks(userId)
	const totalPages = Math.max(1, Math.ceil(chats.length / CHATS_PER_PAGE))
	if (state.chatPage > totalPages) state.chatPage = 1
	const page = state.chatPage
	const pageItems = chats.slice((page - 1) * CHATS_PER_PAGE, page * CHATS_PER_PAGE)

	for (const c of pageItems) {
		const enabled = c.packs.some(p => p.id === packId)
		const label = `${enabled ? '✅ ' : ''}${c.title ?? 'Unnamed'}`
		range
			.text({ text: label, payload: String(c.id) }, async ctx => {
				const s = await packState(ctx)
				const uid = (await ctx.state.user()).id
				const ok = await ctx.deps.repos.chats.setPackEnabled(c.id, s.packId ?? -1, uid, !enabled)
				if (ok) {
					ctx.menu.update()
				} else {
					// not an admin/creator (or guard failed) — no visible change to make
					await ctx.answerCallbackQuery().catch(() => {})
				}
			})
			.row()
	}

	if (totalPages > 1) {
		range
			.text('⬅️', async ctx => {
				const s = await packState(ctx)
				s.chatPage = page > 1 ? page - 1 : totalPages
				ctx.menu.update()
			})
			.text(`${page}/${totalPages}`, async ctx => {
				await ctx.answerCallbackQuery().catch(() => {})
			})
			.text('➡️', async ctx => {
				const s = await packState(ctx)
				s.chatPage = page < totalPages ? page + 1 : 1
				ctx.menu.update()
			})
			.row()
	}
})

installChatsMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		const state = await packState(ctx)
		await openPack(ctx, state.packId ?? -1)
	},
)
