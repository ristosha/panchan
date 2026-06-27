import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { safeEditText } from './shared'

/**
 * Privacy toggles (anonymous / include-in-search). Replaces legacy
 * `preferences/privacy`.
 *
 * `ctx.state.user()` is memoised per update, so after a toggle write within the
 * same update it would still report the old value. We therefore read the fresh row
 * via `repos.users.getById` for both the toggle decision and the checkmark render.
 */
export const privacyMenu = new Menu<MyContext>('pack-privacy')

privacyMenu.dynamic(async (ctx, range) => {
	const { id } = await ctx.state.user()
	const user = (await ctx.deps.repos.users.getById(id)) ?? (await ctx.state.user())

	range
		.text(`${user.anonymous ? '✅ ' : ''}${ctx.t('menu-privacy-button.anonymous')}`, async ctx => {
			const { id } = await ctx.state.user()
			const fresh = (await ctx.deps.repos.users.getById(id)) ?? (await ctx.state.user())
			await ctx.deps.repos.users.setAnonymous(id, !fresh.anonymous)
			ctx.menu.update()
		})
		.row()
	range
		.text(
			`${user.searchIncluded ? '✅ ' : ''}${ctx.t('menu-privacy-button.search-included')}`,
			async ctx => {
				const { id } = await ctx.state.user()
				const fresh = (await ctx.deps.repos.users.getById(id)) ?? (await ctx.state.user())
				await ctx.deps.repos.users.setSearchIncluded(id, !fresh.searchIncluded)
				ctx.menu.update()
			},
		)
		.row()
})

privacyMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		await safeEditText(ctx, ctx.t('menu-preferences'), { parse_mode: 'Markdown' })
	},
)
