import { hydrate } from '@grammyjs/hydrate'
import { Keyboard } from 'grammy'

import { stateMiddlewares } from '~/bot/middlewares/index.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext, type MyConversation } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export async function editPackNsfw (conversation: MyConversation, ctx: MyContext) {
  await conversation.run(i18n)
  await conversation.run(hydrate())
  await conversation.run(stateMiddlewares)

  const editingPackId = ctx.session.data.menu.editingPack

  const yesButton = ctx.t('conv-create-pack-button.yes')
  const noButton = ctx.t('conv-create-pack-button.no')

  const keyboard = new Keyboard()
    .text(yesButton)
    .text(noButton)

  const msg = await ctx.reply(
    ctx.t('conv-create-pack.step-5'),
    { reply_markup: keyboard }
  )

  const { msg: { text: data } } = await conversation.waitFor('msg')
  if (data == null || data.length === 0) {
    await msg.delete().catch()
    await ctx.reply(ctx.t('conv-create-pack.cancelled'))
    return
  }

  const nsfw = data === yesButton

  const userId = (await ctx.state.user()).id
  await conversation.external(async () => (
    await storage.pack.update({
      where: {
        id: editingPackId,
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      },
      data: { tags: { set: nsfw ? ['nsfw'] : [] } }
    })
  ))

  await msg.delete().catch()
  ctx.session.data.menu.editingPack = null
  await ctx.reply(ctx.t('conv-create-pack.ok'), { reply_markup: { remove_keyboard: true } })
}
