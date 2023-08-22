import { hydrate } from '@grammyjs/hydrate'
import { Keyboard } from 'grammy'
import markdownEscape from 'markdown-escape'

import { editPackNsfw } from '~/bot/conversations/edit-pack-nsfw.js'
import { stateMiddlewares } from '~/bot/middlewares/index.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext, type MyConversation } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export async function editPackDescription (conversation: MyConversation, ctx: MyContext) {
  await conversation.run(i18n)
  await conversation.run(hydrate())
  await conversation.run(stateMiddlewares)

  const editingPackId = ctx.session.data.menu.editingPack
  const editingPack = await conversation.external(async () => (
    await storage.pack.findUnique({
      where: {
        id: Number(editingPackId)
      },
      select: { description: true }
    })
  ))

  const remainButton = ctx.t('conv-create-pack-button.remain')
  const emptyButton = ctx.t('conv-create-pack-button.empty')

  const keyboard = new Keyboard()
    .text(emptyButton)

  if (editingPack?.description != null) {
    keyboard.row().text(remainButton)
  }

  const msg = await ctx.reply(
    ctx.t('conv-create-pack.step-4'),
    { reply_markup: keyboard }
  )

  const { msg: { text: data } } = await conversation.waitFor('msg')
  if (data == null || data.length === 0) {
    await msg.delete().catch()
    await ctx.reply(ctx.t('conv-create-pack.cancelled'))
    return
  }

  let description: string | null = null
  if (data !== remainButton && data !== emptyButton) {
    description = markdownEscape(data.substring(0, 300))
  }

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
      data: { description }
    })
  ))

  await editPackNsfw(conversation, ctx)
}
