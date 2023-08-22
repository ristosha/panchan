import { MenuTemplate } from 'grammy-inline-menu'

import { backButtons } from '~/bot/layouts/utils.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext } from '~/bot/types/context.js'

export const language = new MenuTemplate<MyContext>(ctx => ({
  text: ctx.t('menu-language'),
  parse_mode: 'Markdown'
}))

language.select(
  'set',
  i18n.locales,
  {
    columns: 2,
    set: async (ctx, locale) => {
      ctx.session.data.language = locale
      await ctx.i18n.renegotiateLocale()
      return true
    },
    isSet: async (ctx, key) => (await ctx.i18n.getLocale()) === key,
    buttonText: (_, key) => i18n.translate(key, 'full-language-name')
  }
)

language.manualRow(backButtons)
