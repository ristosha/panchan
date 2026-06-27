import { Menu } from '@grammyjs/menu'

import { i18n } from '@/bot/plugins/i18n'
import type { MyContext } from '@/bot/types/context'

import { safeEditText } from './shared'

/**
 * Language picker. Replaces legacy `preferences/language`.
 *
 * Note: the project's i18n is configured with `useSession: false` and negotiates
 * the locale from `ctx.from.language_code`, so `useLocale` only changes the locale
 * for the current update (enough to re-render the menu). We also stash the choice
 * in `session.data.language` to record intent, but making it persist across
 * updates would require the i18n negotiator (owned elsewhere) to read the session.
 */
export const languageMenu = new Menu<MyContext>('pack-lang')

languageMenu.dynamic(async (ctx, range) => {
	const current = await ctx.i18n.getLocale()
	let col = 0
	for (const locale of i18n.locales) {
		const active = current === locale
		const label = `${active ? '✅ ' : ''}${i18n.translate(locale, 'full-language-name')}`
		range.text(label, async ctx => {
			const session = await ctx.session
			session.data.language = locale
			ctx.i18n.useLocale(locale)
			await safeEditText(ctx, ctx.t('menu-language'), { parse_mode: 'Markdown' })
		})
		if (++col % 2 === 0) range.row()
	}
	range.row()
})

languageMenu.back(
	ctx => ctx.t('back-button'),
	async ctx => {
		await safeEditText(ctx, ctx.t('menu-preferences'), { parse_mode: 'Markdown' })
	},
)
