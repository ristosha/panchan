import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { exportTitles, openBrowser, packListText, safeEditText } from './shared'
import { packState } from './state'

/** Single pack view with role-gated actions. Replaces legacy `packs/pack`. */
export const packMenu = new Menu<MyContext>('pack-view')

packMenu.dynamic(async (ctx, range) => {
	const state = await packState(ctx)
	const { role, isDefault, type } = state

	// install: shown for any resolved pack (legacy hid only when role === undefined,
	// i.e. the pack failed to load). Public viewers (role === null) may install too.
	if (role !== undefined) {
		range.submenu(ctx.t('menu-pack-button.install'), 'pack-install', async ctx => {
			await safeEditText(ctx, ctx.t('menu-chat-list'), { parse_mode: 'Markdown' })
		})
	}

	// edit: author only
	if (role === 'author') {
		range.text(ctx.t('menu-pack-button.edit'), async ctx => {
			const s = await packState(ctx)
			await ctx.menu.close()
			await ctx.conversation.enter('pack-edit', s.packId ?? -1)
		})
	}

	// browser: author or editor
	if (role != null) {
		range.submenu(ctx.t('menu-pack-button.browser'), 'pack-browser', async ctx => {
			const s = await packState(ctx)
			s.browserPage = 1
			await openBrowser(ctx)
		})
	}

	range.row()

	// delete: author, non-default packs only
	if (role === 'author' && !isDefault) {
		range.text(ctx.t('menu-pack-button.delete'), async ctx => {
			const s = await packState(ctx)
			await ctx.menu.close()
			await ctx.conversation.enter('pack-delete', s.packId ?? -1)
		})
	}

	// export: author, TITLES packs only
	if (role === 'author' && type === 'TITLES') {
		range.text(ctx.t('menu-pack-button.export'), async ctx => {
			const sent = await exportTitles(ctx)
			if (sent) await ctx.menu.close()
		})
	}

	range.row()
})

packMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		const state = await packState(ctx)
		await safeEditText(ctx, packListText(ctx, state.type))
	},
)
