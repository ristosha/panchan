import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { openPack, PACKS_PER_PAGE, safeEditText } from './shared'
import { packState } from './state'

/** Pack list (own / public) for the current pack type. Replaces legacy `pack-list`. */
export const packListMenu = new Menu<MyContext>('pack-list')

async function modeLabel(ctx: MyContext, key: 'own' | 'public'): Promise<string> {
	const state = await packState(ctx)
	const active = state.mode === key
	return `${active ? '✅ ' : ''}${ctx.t(`menu-pack-list-button.${key}`)}`
}

packListMenu
	.text(
		ctx => ctx.t('menu-pack-list-button.create'),
		async ctx => {
			await ctx.menu.close()
			await ctx.conversation.enter('pack-create')
		},
	)
	.row()
	.text(
		ctx => modeLabel(ctx, 'own'),
		async ctx => {
			const state = await packState(ctx)
			state.mode = 'own'
			state.packPage = 1
			ctx.menu.update()
		},
	)
	.text(
		ctx => modeLabel(ctx, 'public'),
		async ctx => {
			const state = await packState(ctx)
			state.mode = 'public'
			state.packPage = 1
			ctx.menu.update()
		},
	)
	.row()

packListMenu.dynamic(async (ctx, range) => {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id

	const packs =
		state.mode === 'own'
			? await ctx.deps.repos.packs.getOwnPacks(state.type, userId)
			: await ctx.deps.repos.packs.getPublicPacks(state.type)

	const totalPages = Math.max(1, Math.ceil(packs.length / PACKS_PER_PAGE))
	if (state.packPage > totalPages) state.packPage = 1
	const page = state.packPage
	const pageItems = packs.slice((page - 1) * PACKS_PER_PAGE, page * PACKS_PER_PAGE)

	for (const p of pageItems) {
		let emoji = ''
		if (p.default) emoji += '🍀'
		if ((p.tags ?? []).includes('nsfw')) emoji += '🔞'
		const label = `${emoji ? `${emoji} ` : ''}${p.name ?? 'Unnamed'}`
		range
			.submenu({ text: label, payload: String(p.id) }, 'pack-view', async ctx => {
				await openPack(ctx, p.id)
			})
			.row()
	}

	if (totalPages > 1) {
		range
			.text('⬅️', async ctx => {
				const s = await packState(ctx)
				s.packPage = s.packPage > 1 ? s.packPage - 1 : totalPages
				ctx.menu.update()
			})
			.text(`${page}/${totalPages}`, async ctx => {
				await ctx.answerCallbackQuery().catch(() => {})
			})
			.text('➡️', async ctx => {
				const s = await packState(ctx)
				s.packPage = s.packPage < totalPages ? s.packPage + 1 : 1
				ctx.menu.update()
			})
			.row()
	}
})

packListMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		await safeEditText(ctx, ctx.t('menu-general'))
	},
)
