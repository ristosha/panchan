import { MenuTemplate } from 'grammy-inline-menu'

import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const privacy = new MenuTemplate<MyContext>(ctx => ({
  text: ctx.t('menu-privacy'),
  parse_mode: 'Markdown'
}))

privacy.toggle(
  ctx => ctx.t('menu-privacy-button.anonymous'),
  'anonymous',
  {
    isSet: async (ctx) => {
      return (await ctx.state.user()).anonymous
    },
    set: async (ctx, state) => {
      await storage.user.update({
        where: { id: (await ctx.state.user()).id },
        data: { anonymous: state }
      })
      await ctx.state.user(true)
      return true
    }
  }
)

privacy.toggle(
  ctx => ctx.t('menu-privacy-button.search-included'),
  'search-included',
  {
    isSet: async (ctx) => {
      return (await ctx.state.user()).searchIncluded
    },
    set: async (ctx, state) => {
      await storage.user.update({
        where: { id: (await ctx.state.user()).id },
        data: { searchIncluded: state }
      })
      await ctx.state.user(true)
      return true
    }
  }
)

privacy.manualRow(backButtons)
