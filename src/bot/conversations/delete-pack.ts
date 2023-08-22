import { hydrate } from '@grammyjs/hydrate'
import { Keyboard } from 'grammy'

import { stateMiddlewares } from '~/bot/middlewares/index.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext, type MyConversation } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export async function deletePack (conversation: MyConversation, ctx: MyContext) {
  await conversation.run(i18n)
  await conversation.run(hydrate())
  await conversation.run(stateMiddlewares)

  const deletingPackId = ctx.session.data.menu.deletingPack

  const yesButton = ctx.t('conv-delete-pack-button.yes')
  const noButton = ctx.t('conv-delete-pack-button.no')

  const keyboard = new Keyboard()
    .text(noButton).text(yesButton)

  const msg = await ctx.reply(
    ctx.t('conv-delete-pack', { id: deletingPackId }),
    { reply_markup: keyboard }
  )

  const { msg: { text: data } } = await conversation.waitFor('msg')
  if (data == null || data.length === 0) {
    await msg.delete().catch()
    await ctx.reply('conv-delete-pack', { reply_markup: { remove_keyboard: true } })
    return
  }

  if (data !== yesButton && data !== noButton) {
    await msg.delete().catch()
    await ctx.reply(ctx.t('conv-delete-pack.no-button-called'), { reply_markup: { remove_keyboard: true } })
    return
  }

  await msg.delete().catch()

  if (data === yesButton) {
    const userId = (await ctx.state.user()).id
    await conversation.external(async () => (
      await storage.pack.delete({
        where: {
          id: deletingPackId,
          OR: [
            { authorId: userId },
            { editors: { some: { id: userId } } }
          ]
        }
      })
    ))

    await ctx.reply(
      ctx.t('conv-delete-pack.ok', { id: deletingPackId }),
      { reply_markup: { remove_keyboard: true } }
    )
  } else {
    await ctx.reply(
      ctx.t('conv-delete-pack.cancelled', { id: deletingPackId }),
      { reply_markup: { remove_keyboard: true } }
    )
  }

  delete ctx.session.data.menu.deletingPack
  delete ctx.session.data.menu.menuId
  delete ctx.session.data.menu.type
  delete ctx.session.data.menu.isDefault
  delete ctx.session.data.menu.role
}
