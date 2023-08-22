import { MenuTemplate } from 'grammy-inline-menu'

import { getOwnChats } from '~/bot/layouts/packs/getters/get-chats.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

function packId (ctx: MyContext) {
  return parseInt(ctx.match?.at(-1) ?? '-1')
}

export const chats = new MenuTemplate<MyContext>(ctx => {
  // const chats = await getOwnChats(userId)
  // ctx.state.data.chats = chats
  // ctx.state.data.packId = packId
  // chats[0].packs.some(p => p.id)

  const id = packId(ctx)
  ctx.session.data.menu.packId = id

  return {
    text: ctx.t('menu-chat-list'),
    parse_mode: 'Markdown'
  }
})

chats.url(
  ctx => ctx.t('menu-chat-list-button.invite-bot'),
  ctx => `t.me/${ctx.me.username}?startgroup=force_update_chat`
)

chats.select(
  'select',
  async ctx => {
    const id = packId(ctx)
    const userId = (await ctx.state.user()).id
    ctx.state.data.packId = id

    const chats = await getOwnChats(userId)
    ctx.state.data.chats = chats

    return chats.map(c => c.id)
  },
  {
    columns: 1,
    maxRows: 8,
    buttonText: (ctx, key) => {
      return ctx.state.data.chats.find(c => c.id === parseInt(key))?.title ?? 'Unnamed'
    },
    isSet: (ctx, id) => {
      const nId = parseInt(id)
      return ctx.state.data.chats.find(c => c.id === nId)?.packs?.some(p => p.id === ctx.state.data.packId)
    },
    set: async (ctx, id, state) => {
      const userId = (await ctx.state.user()).id
      const packId = ctx.session.data.menu.packId ?? ctx.state.data.packId ?? -1

      const data = state
        ? { packs: { connect: { id: packId } } }
        : { packs: { disconnect: { id: packId } } }

      await storage.chat.update({
        where: {
          id: parseInt(id),
          members: {
            some: {
              userId,
              role: { in: ['ADMIN', 'CREATOR'] }
            }
          }
        },
        data
      }).catch(async (er) => {
        console.error(er)
        await ctx.answerCallbackQuery({ text: ctx.t('menu-chat-list.error') })
      })
      return true
    },
    getCurrentPage: (ctx) => ctx.session.data.menu.chatPage ?? 1,
    setPage: (ctx, page) => {
      ctx.session.data.menu.chatPage = page
    }
  }
)

chats.manualRow(backButtons)
