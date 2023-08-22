import { MenuTemplate } from 'grammy-inline-menu'

import { element } from '~/bot/layouts/packs/browser/element.js'
import { countOwnPackElementsById, getOwnPackElementsById } from '~/bot/layouts/packs/getters/get-packs.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'

export const elementBrowser = new MenuTemplate<MyContext>(async ctx => {
  const packId = parseInt(ctx.match?.at(-1) ?? '-1')
  const { id: userId } = await ctx.state.user()
  const count = await countOwnPackElementsById(packId, userId)

  const isMedia = ctx.match?.at(0)?.includes('media') ?? false
  const elPerPage = isMedia ? 1 : 8
  const totalPages = Math.ceil(count / elPerPage)
  ctx.session.data.menu.maxBrowserPage = totalPages
  if (ctx.session.data.menu.browserPage > totalPages) {
    ctx.session.data.menu.browserPage = 1
  }

  if (totalPages === 0) {
    return { text: ctx.t('menu-element-browser.empty', { packId }), parse_mode: 'Markdown' }
  }

  const page = ctx.session.data.menu.browserPage ?? 1
  const elements = await getOwnPackElementsById(
    packId,
    userId,
    elPerPage,
    (page - 1) * elPerPage
  )

  ctx.session.data.menu.elements = elements.map(el => el.id)

  const elementString = isMedia
    ? `#${elements[0].id}`
    : elements.map(({ id, content }) => (
      ctx.t('menu-element-browser.element', {
        id,
        content: content.split('\n').join(' \\ ')
      })))
      .join('\n')

  const text = ctx.t('menu-element-browser', {
    page,
    totalPages,
    packId,
    elements: elementString
  })

  return isMedia
    ? { text, type: elements[0].type.toLowerCase(), media: elements[0].content, parse_mode: 'Markdown', disable_web_page_preview: true }
    : { text, parse_mode: 'Markdown', disable_web_page_preview: true }
})

elementBrowser.chooseIntoSubmenu(
  'el',
  ctx => ctx.session.data.menu.elements ?? [],
  element,
  {
    columns: 4,
    hide: (ctx) => ctx.session.data.menu.maxBrowserPage === 0
  }
)

elementBrowser.pagination(
  'page',
  {
    setPage: (ctx, page) => {
      ctx.session.data.menu.browserPage = page
    },
    getCurrentPage: (ctx) => ctx.session.data.menu.browserPage ?? 1,
    getTotalPages: (ctx) => ctx.session.data.menu.maxBrowserPage,
    hide: (ctx) => ctx.session.data.menu.maxBrowserPage === 0
  }
)

elementBrowser.manualRow(backButtons)
