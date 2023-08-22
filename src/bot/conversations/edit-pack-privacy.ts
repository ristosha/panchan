import { hydrate } from '@grammyjs/hydrate'
import { Keyboard } from 'grammy'

import { editPackDescription } from '~/bot/conversations/edit-pack-description.js'
import { stateMiddlewares } from '~/bot/middlewares/index.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext, type MyConversation } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export async function editPackPrivacy (conversation: MyConversation, ctx: MyContext) {
  await conversation.run(i18n)
  await conversation.run(hydrate())
  await conversation.run(stateMiddlewares)

  const editingPackId = ctx.session.data.menu.editingPack

  const privateButton = ctx.t('conv-create-pack-button.private')
  const publicButton = ctx.t('conv-create-pack-button.public')

  const keyboard = new Keyboard()
    .text(privateButton)
    .text(publicButton)

  const msg = await ctx.reply(
    ctx.t('conv-create-pack.step-3'),
    { reply_markup: keyboard }
  )

  const { msg: { text: data } } = await conversation.waitFor('msg')
  if (data == null || data.length === 0) {
    await msg.delete().catch()
    await ctx.reply(ctx.t('conv-create-pack.cancelled'))
    return
  }

  const isPrivate = data === privateButton

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
      data: { private: isPrivate }
    })
  ))

  await editPackDescription(conversation, ctx)
}
