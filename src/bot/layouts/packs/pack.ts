import { InputFile } from 'grammy'
import { deleteMenuFromContext, MenuTemplate } from 'grammy-inline-menu'
import markdownEscape from 'markdown-escape'

import exportTitlesAsTxt from '~/bot/helpers/export-titles-as-txt.js'
import { elementBrowser } from '~/bot/layouts/packs/element-browser.js'
import { getOwnPackById, getPublicPackById } from '~/bot/layouts/packs/getters/get-packs.js'
import { chats } from '~/bot/layouts/packs/install-chat-list.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'

export const pack = new MenuTemplate<MyContext>(async ctx => {
  const id = parseInt(ctx.match?.at(-1) ?? '-1')
  const { id: userId } = await ctx.state.user()

  const data = ctx.session.data.menu.packMode === 'own'
    ? await getOwnPackById(id, userId)
    : await getPublicPackById(id)

  if (data === null) {
    ctx.session.data.menu.role = undefined
    return { text: ctx.t('menu-pack.not-found '), parse_mode: 'Markdown' }
  }

  ctx.session.data.menu.menuId = data.id
  ctx.session.data.menu.type = data.type
  ctx.session.data.menu.isDefault = data.default

  const userRole = data.authorId === userId
    ? 'author'
    : data.editors.some(e => e.id === userId)
      ? 'editor'
      : null

  ctx.session.data.menu.role = userRole

  const text = ctx.t('menu-pack', {
    id: data.id,
    name: markdownEscape(data.name),
    type: data.type.toLowerCase(),
    private: String(data.private),
    elementCount: data._count.elements,
    chatCount: data._count.usedInChats,
    nsfw: String(data.tags.includes('nsfw')),
    default: String(data.default),
    description: data.description == null ? ctx.t('no-description') : markdownEscape(data.description),
    author: ((data?.author?.anonymous) === true) || data.author?.username == null
      ? ctx.t('anonymous-author')
      : data.author.username
  })

  return { text, parse_mode: 'Markdown', disable_web_page_preview: true }
})

pack.submenu(
  ctx => ctx.t('menu-pack-button.install'),
  'install',
  chats,
  {
    hide: (ctx) => ctx.session.data.menu.role === undefined
  }
)

pack.interact(
  ctx => ctx.t('menu-pack-button.edit'),
  'edit',
  {
    do: async (ctx) => {
      await ctx.answerCallbackQuery().catch()
      await deleteMenuFromContext(ctx)
      ctx.session.data.menu.editingPack = ctx.session.data.menu.menuId
      await ctx.conversation.enter('edit-privacy')
      return false
    },
    hide: (ctx) => ctx.session.data.menu.role !== 'author'
  }
)

pack.submenu(
  ctx => ctx.t('menu-pack-button.browser'),
  'browser',
  elementBrowser,
  {
    joinLastRow: true,
    hide: (ctx) => ctx.session.data.menu.role == null
  }
)

pack.interact(
  ctx => ctx.t('menu-pack-button.delete'),
  'delete',
  {
    do: async (ctx) => {
      await ctx.answerCallbackQuery().catch()
      await deleteMenuFromContext(ctx)
      ctx.session.data.menu.deletingPack = ctx.session.data.menu.menuId
      await ctx.conversation.enter('delete-pack')
      return false
    },
    hide: (ctx) =>
      ctx.session.data.menu.role !== 'author' ||
      ctx.session.data.menu.isDefault
  }
)

pack.interact(
  ctx => ctx.t('menu-pack-button.export'),
  'export',
  {
    joinLastRow: true,
    do: async (ctx) => {
      const userId = (await ctx.state.user()).id
      const packId = ctx.session.data.menu.menuId ?? -1
      const res = await exportTitlesAsTxt(packId, userId)
      if (res.length === 0) {
        await ctx.answerCallbackQuery({
          text: ctx.t('conv-export-pack.empty')
        }).catch()
        return true
      } else {
        await ctx.answerCallbackQuery().catch()
        await deleteMenuFromContext(ctx)
        await ctx.replyWithDocument(new InputFile(Buffer.from(res), `pack-${packId as number}-export.txt`))
        return false
      }
    },
    hide: (ctx) =>
      ctx.session.data.menu.role !== 'author' ||
      ctx.session.data.menu.type !== 'TITLES'
  }
)

pack.manualRow(backButtons)
