import { Composer, InputFile, matchFilter } from 'grammy'

import { stretchImage, stretchVideo } from '~/api/generators/stretch.js'
import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import getAnimationOrVideoId from '~/bot/helpers/get-animation-or-video-id.js'
import { mediaTransaction } from '~/bot/helpers/media-transaction.js'
import noMediaError from '~/bot/helpers/no-media-error.js'
import { prepareMediaWithOutput } from '~/bot/helpers/prepare-media.js'
import { saveMedia } from '~/bot/helpers/save-media.js'
import { type MyContext } from '~/bot/types/context.js'

export const stretch = new Composer<MyContext>()
const command = stretch.command([
  'stretch', 'str', 'растянуть', 'раст'
])

command.use(rateLimit)

command
  .on([
    'msg:video',
    'msg:animation',
    'msg:sticker:is_video',
    'msg:video_note'
  ])
  .use(async ctx => {
    void ctx.replyWithChatAction('choose_sticker').catch()

    const {
      inputFile,
      outputFile,
      fileName,
      id,
      sourceFileId,
      watermark
    } = await prepareMediaWithOutput(ctx, 'mp4')

    await mediaTransaction({
      ctx,
      remove: [inputFile, outputFile],
      run: async () => {
        await stretchVideo({ inputFile, outputFile, watermark })
        const result = new InputFile(outputFile, fileName)
        const {
          resultFileId,
          resultFileUniqueId
        } = getAnimationOrVideoId(await ctx.replyWithAnimation(result))
        await saveMedia({ ctx, id, sourceFileId, resultFileId, resultFileUniqueId, type: 'STRETCH' })
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
  .use(async ctx => {
    void ctx.replyWithChatAction('choose_sticker').catch()

    const {
      inputFile,
      outputFile,
      fileName,
      id,
      sourceFileId,
      watermark
    } = await prepareMediaWithOutput(ctx, 'png')
    await mediaTransaction({
      ctx,
      remove: [inputFile, outputFile],
      run: async () => {
        await stretchImage({ inputFile, outputFile, watermark })
        const result = new InputFile(outputFile, fileName)
        const { photo } = await ctx.replyWithPhoto(result)
        const { file_id: resultFileId, file_unique_id: resultFileUniqueId } = photo[photo.length - 1]
        await saveMedia({ ctx, id, sourceFileId, resultFileId, resultFileUniqueId, type: 'STRETCH' })
      }
    })
  })

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
