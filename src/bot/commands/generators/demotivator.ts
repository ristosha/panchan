import { Composer, InputFile, matchFilter } from 'grammy'

import { createDemotivatorImage, createDemotivatorVideo } from '~/api/generators/demotivator.js'
import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import getAnimationOrVideoId from '~/bot/helpers/get-animation-or-video-id.js'
import { mediaTransaction } from '~/bot/helpers/media-transaction.js'
import noMediaError from '~/bot/helpers/no-media-error.js'
import { prepareMedia, prepareMediaWithOutput } from '~/bot/helpers/prepare-media.js'
import { saveMedia } from '~/bot/helpers/save-media.js'
import { type MyContext } from '~/bot/types/context.js'

export const demotivator = new Composer<MyContext>()
const command = demotivator.command(['demotivator', 'dem', 'demik'])

command.use(rateLimit)

command
  .on([
    'msg:video',
    'msg:animation',
    'msg:sticker:is_video',
    'msg:video_note'
  ])
  .use(async ctx => {
    void ctx.replyWithChatAction('choose_sticker').then().catch()

    const duration = ctx.msg.video?.duration ?? ctx.msg.video_note?.duration
    const circle = 'video_note' in ctx.msg && ctx.msg.video_note != null

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
        await createDemotivatorVideo({ inputFile, outputFile, text, duration, opts, circle, watermark })
        const result = new InputFile(outputFile, fileName)

        const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(
          opts.video != null && opts.video === true
            ? await ctx.replyWithVideo(result)
            : await ctx.replyWithAnimation(result)
        )

        await saveMedia({
          ctx,
          id,
          sourceFileId,
          resultFileId,
          resultFileUniqueId,
          text,
          randomElements,
          meta: opts,
          type: 'DEMOTIVATOR'
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
    'msg:sticker:is_animated',
    'msg:sticker:is_video',
    'msg:sticker:premium_animation'
  ]))
  .use(async ctx => {
    void ctx.replyWithChatAction('choose_sticker').then().catch()

    const {
      inputFile,
      text,
      id,
      sourceFileId,
      fileName,
      opts,
      watermark,
      randomElements
    } = await prepareMedia(ctx, 'png')
    await mediaTransaction({
      ctx,
      remove: [inputFile],
      run: async () => {
        const buffer = await createDemotivatorImage({ inputFile, text, opts, watermark })
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
          type: 'DEMOTIVATOR'
        })
      }
    })
  })

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
