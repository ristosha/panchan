import { MenuTemplate } from 'grammy-inline-menu'

import { getOwnElementById } from '~/bot/layouts/packs/getters/get-packs.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const element = new MenuTemplate<MyContext>(async ctx => {
  const id = parseInt(ctx.match?.at(-1) ?? '-1')
  const { id: userId } = await ctx.state.user()

  const element = await getOwnElementById(id, userId)
  ctx.session.data.menu.elementId = element?.id

  if (element == null) {
    return { text: ctx.t('menu-element.empty'), parse_mode: 'Markdown' }
  }

  const isMedia = element.type !== 'TEXT'

  const text = ctx.t('menu-element', {
    id: element.id,
    type: element.type,
    content: element.content.replaceAll('`', '\\`'),
    author: element.author?.username ?? ctx.t('anonymous-author')
  })

  return isMedia
    ? {
        text,
        type: element.type.toLowerCase(),
        media: element.content,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
    : {
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      }
})

element.interact(
  ctx => ctx.t('menu-element-button.delete'),
  'delete',
  {
    hide: ctx => ctx.session.data.menu.elementId === null,
    do: async (ctx) => {
      const { id: userId } = await ctx.state.user()
      const deleted = await storage.packElement.delete({
        where: {
          id: ctx.session.data.menu.elementId,
          pack: {
            OR: [
              { authorId: userId },
              { editors: { some: { id: userId } } }
            ]
          }
        }
      })

      await ctx.answerCallbackQuery({
        text: deleted == null ? ctx.t('menu-element.unsuccess') : ctx.t('menu-element.success')
      })

      return '../'
    }
  }
)

element.manualRow(backButtons)
