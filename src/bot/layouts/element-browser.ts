import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { ELEMENTS_PER_PAGE, openBrowser, openElement, openPack } from './shared'
import { packState } from './state'

/** Paginated element browser. Replaces legacy `packs/element-browser`. */
export const elementBrowserMenu = new Menu<MyContext>('pack-browser')

elementBrowserMenu.dynamic(async (ctx, range) => {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id
	const packId = state.packId ?? -1

	const count = await ctx.deps.repos.packElements.countOwn(packId, userId)
	const totalPages = Math.ceil(count / ELEMENTS_PER_PAGE)
	if (totalPages === 0) return

	let page = state.browserPage
	if (page > totalPages) page = 1
	if (page < 1) page = 1

	const elements = await ctx.deps.repos.packElements.getOwn(
		packId,
		userId,
		ELEMENTS_PER_PAGE,
		(page - 1) * ELEMENTS_PER_PAGE,
	)

	let col = 0
	for (const e of elements) {
		range.submenu({ text: `#${e.id}`, payload: String(e.id) }, 'pack-element', async ctx => {
			await openElement(ctx, e.id)
		})
		if (++col % 4 === 0) range.row()
	}
	range.row()

	if (totalPages > 1) {
		range
			.text('⬅️', async ctx => {
				const s = await packState(ctx)
				s.browserPage = page > 1 ? page - 1 : totalPages
				await openBrowser(ctx)
			})
			.text(`${page}/${totalPages}`, async ctx => {
				await ctx.answerCallbackQuery().catch(() => {})
			})
			.text('➡️', async ctx => {
				const s = await packState(ctx)
				s.browserPage = page < totalPages ? page + 1 : 1
				await openBrowser(ctx)
			})
			.row()
	}
})

elementBrowserMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		const state = await packState(ctx)
		await openPack(ctx, state.packId ?? -1)
	},
)
