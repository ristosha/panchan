import { Composer } from 'grammy'

import { extractId } from '~/bot/helpers/extractors.js'
import { getOwnPackById } from '~/bot/layouts/packs/getters/get-packs.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const promote = new Composer<MyContext>()
promote.command('promote', async (ctx) => {
  const { id } = extractId(ctx)
  if (isNaN(id)) {
    await ctx.reply(ctx.t('command-promote.no-pack'))
    return
  }

  const replied = ctx.msg.reply_to_message?.from
  const rawEditorId = replied?.id
  if (rawEditorId == null) {
    await ctx.reply(ctx.t('command-promote.no-user'))
    return
  }

  const userId = (await ctx.state.user()).id
  const checkPack = await getOwnPackById(id, userId)
  if (checkPack == null || checkPack.authorId !== userId) {
    await ctx.reply(ctx.t('command-promote.empty'))
    return
  }

  const editor = await storage.user.findFirst({
    where: { telegramId: rawEditorId }
  })
  if (editor == null) {
    await ctx.reply(ctx.t('command-promote.user-not-found'))
    return
  }

  const check = checkPack.editors.some(e => e.id === editor.id)
  if (check) {
    await ctx.reply(ctx.t('command-promote.already'))
    return
  }

  const pack = await storage.pack.update({
    where: {
      id,
      authorId: userId
    },
    data: {
      editors: {
        connect: {
          id: editor.id
        }
      }
    },
    select: {
      editors: true
    }
  })

  await ctx.reply(ctx.t('command-promote', {
    packId: id,
    name: replied?.first_name ?? editor.username ?? ctx.t('anonymous-author'),
    editorCount: pack.editors.length,
    editors: pack.editors.map(e => ctx.t('user-link', {
      name: e.username ?? String(e.telegramId),
      id: e.username ?? String(e.telegramId)
    })).join(', ')
  }),
  {
    disable_web_page_preview: true
  })
})
