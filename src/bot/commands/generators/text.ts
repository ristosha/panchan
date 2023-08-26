import { Composer, InputFile, matchFilter } from 'grammy'

import { createTextImage, createTextVideo } from '~/api/generators/text.js'
import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import getAnimationOrVideoId from '~/bot/helpers/get-animation-or-video-id.js'
import { mediaTransaction } from '~/bot/helpers/media-transaction.js'
import noMediaError from '~/bot/helpers/no-media-error.js'
import { prepareMedia, prepareMediaWithOutput } from '~/bot/helpers/prepare-media.js'
import { saveMedia } from '~/bot/helpers/save-media.js'
import autoQuote from '~/bot/middlewares/auto-quote.js'
import { type MyContext } from '~/bot/types/context.js'

export const text = new Composer<MyContext>()
const command = text.command([
  'text', 'lobster', 'лобстер', 'текст'
])

command.use(rateLimit)
command.use(autoQuote())

command
  .on([
    'msg:animation',
    'msg:video',
    'msg:sticker:is_video'
  ])
  .use(async (ctx) => {
    void ctx.replyWithChatAction('choose_sticker').catch()

    const meta = ctx.msg.video
    const {
      inputFile,
      outputFile,
      text,
      id,
      sourceFileId,
      fileName,
      opts,
      watermark,
      randomElements
    } = await prepareMediaWithOutput(ctx, 'mp4')

    await mediaTransaction({
      ctx,
      remove: [inputFile, outputFile],
      run: async () => {
        await createTextVideo({ inputFile, outputFile, text, meta, opts, watermark })
        const result = new InputFile(outputFile, fileName)
        const {
          resultFileId,
          resultFileUniqueId
        } = getAnimationOrVideoId(await ctx.replyWithAnimation(result))
        await saveMedia({
          ctx,
          id,
          sourceFileId,
          resultFileId,
          resultFileUniqueId,
          text,
          randomElements,
          meta: opts,
          type: 'TEXT'
        })
      }
    })
  })

command
  .on([
    'msg:photo',
    'msg:sticker'
  ])
  .drop(matchFilter([
    'msg:sticker:is_video',
    'msg:sticker:is_animated',
    'msg:sticker:premium_animation'
  ]))
  .use(async (ctx) => {
    void ctx.replyWithChatAction('choose_sticker').catch()

    const {
      inputFile,
      text,
      fileName,
      id,
      sourceFileId,
      opts,
      watermark,
      randomElements
    } = await prepareMedia(ctx, 'png')

    await mediaTransaction({
      ctx,
      remove: [inputFile],
      run: async () => {
        const buffer = await createTextImage({ inputFile, text, opts, watermark })
        const result = new InputFile(buffer, fileName)
        const { photo } = await ctx.replyWithPhoto(result)
        const { file_id: resultFileId, file_unique_id: resultFileUniqueId } = photo[photo.length - 1]
        await saveMedia({
          ctx,
          id,
          sourceFileId,
          resultFileId,
          resultFileUniqueId,
          text,
          randomElements,
          meta: opts,
          type: 'TEXT'
        })
      }
    })
  })

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
