import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { openBrowser } from './shared'
import { packState } from './state'

/** Single element view with a delete action. Replaces legacy `packs/browser/element`. */
export const elementMenu = new Menu<MyContext>('pack-element')

elementMenu.dynamic(async (ctx, range) => {
	const state = await packState(ctx)
	if (state.elementId == null) return

	range.text(ctx.t('menu-element-button.delete'), async ctx => {
		const s = await packState(ctx)
		const userId = (await ctx.state.user()).id
		const deleted =
			s.elementId != null ? await ctx.deps.repos.packElements.deleteOwn(s.elementId, userId) : false

		await ctx
			.answerCallbackQuery({
				text: deleted ? ctx.t('menu-element.success') : ctx.t('menu-element.unsuccess'),
			})
			.catch(() => {})

		// back up to the (refreshed) browser, mirroring the legacy `'../'` return.
		ctx.menu.nav('pack-browser')
		await openBrowser(ctx)
	})
})

elementMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		await openBrowser(ctx)
	},
)
