import { type PackType } from '@prisma/client'
import { deleteMenuFromContext, MenuTemplate } from 'grammy-inline-menu'

import { getOwnPacks, getPublicPacks } from '~/bot/layouts/packs/getters/get-packs.js'
import { pack } from '~/bot/layouts/packs/pack.js'
import { backButtons } from '~/bot/layouts/utils.js'
import { type MyContext } from '~/bot/types/context.js'

function createPackMenu (type: PackType) {
  const packList = new MenuTemplate<MyContext>(ctx => ({
    text: ctx.t('menu-pack-list', { type: type.toLowerCase() }),
    parse_mode: 'Markdown'
  }))

  packList.interact(
    ctx => ctx.t('menu-pack-list-button.create'),
    'create',
    {
      do: async (ctx) => {
        await ctx.answerCallbackQuery().catch()
        await deleteMenuFromContext(ctx)
        await ctx.conversation.enter('create-pack')
        return false
      }
    }
  )

  packList.select(
    'mode',
    ['own', 'public'],
    {
      columns: 2,
      buttonText: (ctx, key) => ctx.t(`menu-pack-list-button.${key}`),
      isSet: (ctx, key) => {
        return ctx.session.data.menu.packMode === key ||
          (key === 'public' && ctx.session.data.menu.packMode !== 'own') // not initialized
      },
      set: (ctx, key) => {
        ctx.session.data.menu.packMode = key as 'own' | 'public'
        return true
      }
    }
  )

  packList.chooseIntoSubmenu(
    'pack',
    async ctx => {
      const isOwn = ctx.session.data?.menu?.packMode === 'own'
      const packs = isOwn
        ? await getOwnPacks(type, (await ctx.state.user()).id)
        : await getPublicPacks(type)
      ctx.state.data.packs = packs
      return packs.map(p => p.id)
    },
    pack,
    {
      columns: 1,
      maxRows: 7,
      getCurrentPage: (ctx) => ctx.session.data.menu.packPage,
      setPage: (ctx, page) => {
        ctx.session.data.menu.packPage = page
      },
      buttonText: ({ state }, id) => {
        const {
          default: isDefault = false,
          tags = [],
          name = 'Unnamed'
        } = state.data.packs.find((p: { id: number }) => String(p.id) === id) ?? {}

        let emoji = ''
        if (isDefault != null && (Boolean(isDefault))) {
          emoji += '🍀'
        }
        if ((tags as any[]).includes('nsfw')) {
          emoji += '🔞'
        }

        return `${emoji.length > 0 ? emoji + ' ' : ''}${String(name)}`
      }
    }
  )

  packList.manualRow(backButtons)

  return packList
}

export const titlePackList = createPackMenu('TITLES')
export const mediaPackList = createPackMenu('MEDIA')
