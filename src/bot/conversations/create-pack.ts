import { hydrate } from '@grammyjs/hydrate'
import { InlineKeyboard } from 'grammy'
import markdownEscape from 'markdown-escape'

import { editPackPrivacy } from '~/bot/conversations/edit-pack-privacy.js'
import { stateMiddlewares } from '~/bot/middlewares/index.js'
import { i18n } from '~/bot/plugins/i18n.js'
import { type MyContext, type MyConversation } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export async function createPack (conversation: MyConversation, ctx: MyContext) {
  await conversation.run(i18n)
  await conversation.run(hydrate())
  await conversation.run(stateMiddlewares)

  /*
  Step 1
   */
  const step1Kb = new InlineKeyboard()
    .text(ctx.t('media-pack'), 'cp/media')
    .text(ctx.t('title-pack'), 'cp/title').row()
    .text(ctx.t('conv-create-pack-button.cancel'), 'cp/cancel')

  const step1 = await ctx.reply(
    ctx.t('conv-create-pack.step-1'),
    { reply_markup: step1Kb }
  )

  const { callbackQuery: { data: step1Query } } = await conversation.waitForCallbackQuery(/cp\/.+/)
  const [, step1Data] = step1Query.split('/')
  if (step1Data === 'cancel') {
    await ctx.answerCallbackQuery().catch()
    await step1.delete().catch()
    await ctx.reply(ctx.t('conv-create-pack.cancelled'))
    return
  }

  await ctx.answerCallbackQuery().catch()
  await step1.delete().catch()

  // Step 1 result
  const packType = step1Data === 'media' ? 'MEDIA' : 'TITLES'

  /*
  Step 2
   */
  const step2 = await ctx.reply(ctx.t('conv-create-pack.step-2'))
  const { msg: { text: step2Data } } = await conversation.waitFor('msg')
  if (step2Data == null || step2Data.length === 0) {
    await step2.delete()
    await ctx.reply(ctx.t('conv-create-pack.cancelled'))
    return
  }

  await step2.delete().catch()

  // Step 2 result
  const name = markdownEscape(step2Data.substring(0, 32))

  const { id } = await conversation.external(async () => (
    await storage.pack.create({
      data: {
        name,
        type: packType,
        authorId: (await ctx.state.user()).id
      }
    })
  ))

  ctx.session.data.menu.editingPack = id
  await editPackPrivacy(conversation, ctx)
}
