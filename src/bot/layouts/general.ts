import { MenuMiddleware, MenuTemplate } from 'grammy-inline-menu'

import { mediaPackList, titlePackList } from '~/bot/layouts/pack-list.js'
import { preferences } from '~/bot/layouts/preferences.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export const general = new MenuTemplate<MyContext>(ctx => ({
  text: ctx.t('menu-general'),
  parse_mode: 'Markdown'
}))

general.submenu(
  ctx => ctx.t('menu-general-button.title-packs'),
  'titles',
  titlePackList
)

general.submenu(
  ctx => ctx.t('menu-general-button.media-packs'),
  'media',
  mediaPackList,
  { joinLastRow: true }
)

general.interact(
  ctx => ctx.t('menu-general-button.guide'),
  'guide',
  {
    do: async (ctx) => {
      await ctx.reply(`[${ctx.t('menu-general-button.guide')}](${config.BOT_GUIDE_URL})`)
      return true
    }
  }
)

general.submenu(
  ctx => ctx.t('menu-general-button.preferences'),
  'prefs',
  preferences, {
    joinLastRow: true
  }
)

export const generalMenu = new MenuMiddleware('/', general)
