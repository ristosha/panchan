import { MenuTemplate } from 'grammy-inline-menu'

import { language } from '~/bot/layouts/preferences/language.js'
import { privacy } from '~/bot/layouts/preferences/privacy.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'

export const preferences = new MenuTemplate<MyContext>(ctx => ({
  text: ctx.t('menu-preferences'),
  parse_mode: 'Markdown'
}))

preferences.submenu(
  ctx => ctx.t('menu-preferences-button.language'),
  'lang',
  language
)

preferences.submenu(
  ctx => ctx.t('menu-preferences-button.privacy'),
  'privacy',
  privacy,
  { joinLastRow: true }
)

preferences.manualRow(backButtons)
