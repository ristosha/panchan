import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { safeEditText } from './shared'

/** Preferences hub. Replaces legacy `preferences`. */
export const preferencesMenu = new Menu<MyContext>('pack-prefs')

preferencesMenu
	.submenu(
		ctx => ctx.t('menu-preferences-button.language'),
		'pack-lang',
		async ctx => {
			await safeEditText(ctx, ctx.t('menu-language'), { parse_mode: 'Markdown' })
		},
	)
	.submenu(
		ctx => ctx.t('menu-preferences-button.privacy'),
		'pack-privacy',
		async ctx => {
			await safeEditText(ctx, ctx.t('menu-privacy'), { parse_mode: 'Markdown' })
		},
	)
	.row()

preferencesMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		await safeEditText(ctx, ctx.t('menu-general'))
	},
)
