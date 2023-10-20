import { type GeneratedMediaType, type MediaMIME } from '@prisma/client'
import { type Middleware } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export function dupedRequest (type: GeneratedMediaType, medias: MediaMIME[], run: (ctx: MyContext, dupedResultId: string) => any): Middleware<MyContext> {
  return async function (ctx, next) {
    const message = ctx.message as any
    for (const media of medias) {
      if (Object.hasOwn(message, media.toLowerCase()) && message[media.toLowerCase()].file_id != null) {
        const sourceFileId = message[media.toLowerCase()].file_id
        const dupe = await storage.generatedMedia.findFirst({
          where: {
            type,
            sourceFileId
          }
        })

        if (dupe != null) {
          return run(ctx, dupe.resultFileId)
        }

        break
      }
    }

    await next()
  }
}
