import { Composer, InputFile, matchFilter } from 'grammy'

import { awareScaleImage, awareScaleVideo } from '~/api/generators/aware-scale.js'
import { createLoader } from '~/api/loader.js'
import { resizeComposite } from '~/api/schema/composite.js'
import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import getAnimationOrVideoId from '~/bot/helpers/get-animation-or-video-id.js'
import { mediaTransaction } from '~/bot/helpers/media-transaction.js'
import noMediaError from '~/bot/helpers/no-media-error.js'
import { prepareMediaWithOutput } from '~/bot/helpers/prepare-media.js'
import { saveMedia } from '~/bot/helpers/save-media.js'
import autoQuote from '~/bot/middlewares/auto-quote.js'
import { type MyContext } from '~/bot/types/context.js'

export const awareScale = new Composer<MyContext>()
const command = awareScale.command([
  'aware-scale', 'ascale', 'scale', 'жмых'
])

command.use(rateLimit)
command.use(autoQuote())

command
  .on([
    'msg:video',
    'msg:animation',
    'msg:sticker:is_video',
    'msg:video_note'
  ])
  .use(async ctx => {
    void ctx.replyWithChatAction('typing').catch()
    const {
      inputFile,
      outputFile,
      fileName,
      id,
      sourceFileId,
      watermark
    } = await prepareMediaWithOutput(ctx, 'mp4')

    const loader = createLoader()
    const msg = await ctx.reply(ctx.t('command-aware-scale.prepare'))

    loader.subscribe(
      async (step, progress, remaining) => {
        await msg.editText(ctx.t(`command-aware-scale.${step}`, {
          progress, remaining
        }), {
          parse_mode: 'Markdown'
        })
      }, 10
    )

    await mediaTransaction({
      ctx,
      queue: 'scale',
      disableLoader: true,
      remove: [inputFile, outputFile],
      run: async () => {
        await awareScaleVideo({ inputFile, outputFile, loader, watermark })
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
          type: 'AWARE_SCALE'
        })
        await msg.delete()
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
    void ctx.replyWithChatAction('choose_sticker').catch()
    const {
      inputFile,
      outputFile,
      fileName,
      id,
      sourceFileId,
      opts,
      watermark
    } = await prepareMediaWithOutput(ctx, 'png')
    const args = resizeComposite.build(opts)

    await mediaTransaction({
      ctx,
      queue: 'scale',
      disableLoader: true,
      remove: [inputFile, outputFile],
      run: async () => {
        await awareScaleImage({ inputFile, outputFile, watermark, ...args })
        const result = new InputFile(outputFile, fileName)
        const { photo } = await ctx.replyWithPhoto(result)
        const { file_id: resultFileId, file_unique_id: resultFileUniqueId } = photo[photo.length - 1]
        await saveMedia({
          ctx,
          id,
          sourceFileId,
          resultFileId,
          resultFileUniqueId,
          meta: opts,
          type: 'AWARE_SCALE'
        })
      }
    })
  })

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
