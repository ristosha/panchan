import { Composer } from 'grammy'

import { extractMediaExtended } from '~/bot/helpers/extractors.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const handleUsage = new Composer<MyContext>()

handleUsage
  .on(['msg:photo', 'msg:video', 'msg:animation'])
  .use(async (ctx, next) => {
    if (ctx.from == null || ctx.from.is_bot) {
      await next()
      return
    }

    const file = extractMediaExtended(ctx)
    if (file == null) {
      await next()
      return
    }

    const media = await storage.generatedMedia.findFirst({
      where: {
        resultFileUniqueId: file.uniqueFileId
      }
    })

    if (media == null) {
      await next()
      return
    }

    const chatId = ctx.state.chat != null
      ? (await ctx.state.chat()).id
      : null

    await storage.generatedMedia.update({
      where: { id: media.id },
      data: {
        uses: {
          create: {
            chatId,
            usedByTelegramId: ctx.from.id
          }
        }
      }
    })
    await next()
  })
