import { Menu } from '@grammyjs/menu'

import type { MyContext } from '@/bot/types/context'

import { packListText, safeEditText } from './shared'
import { packState } from './state'

/** Root menu (replaces legacy `general` MenuTemplate). Registered on the bot. */
export const generalMenu = new Menu<MyContext>('pack-root')

generalMenu
	.submenu(
		ctx => ctx.t('menu-general-button.title-packs'),
		'pack-list',
		async ctx => {
			const state = await packState(ctx)
			state.type = 'TITLES'
			state.packPage = 1
			await safeEditText(ctx, packListText(ctx, 'TITLES'))
		},
	)
	.submenu(
		ctx => ctx.t('menu-general-button.media-packs'),
		'pack-list',
		async ctx => {
			const state = await packState(ctx)
			state.type = 'MEDIA'
			state.packPage = 1
			await safeEditText(ctx, packListText(ctx, 'MEDIA'))
		},
	)
	.row()
	.url(
		ctx => ctx.t('menu-general-button.guide'),
		ctx => ctx.deps.config.BOT_GUIDE_URL,
	)
	.submenu(
		ctx => ctx.t('menu-general-button.preferences'),
		'pack-prefs',
		async ctx => {
			await safeEditText(ctx, ctx.t('menu-preferences'), { parse_mode: 'Markdown' })
		},
	)
