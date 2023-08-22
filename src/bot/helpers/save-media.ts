import { type GeneratedMediaType, MediaMIME } from '@prisma/client'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export interface SaveMediaParams {
  ctx: MyContext
  type: GeneratedMediaType
  id: string
  sourceFileId: string
  resultFileId: string
  resultFileUniqueId: string
  mime?: MediaMIME
  text?: string
  meta?: Record<string, any>
}

export async function saveMedia (params: SaveMediaParams) {
  const {
    ctx,
    id,
    type,
    text,
    meta = {},
    sourceFileId,
    resultFileId,
    resultFileUniqueId,
    mime = detectMIME(ctx)
  } = params

  const authorId = (await ctx.state.user()).id
  const chatId = ctx.state.chat != null
    ? (await ctx.state.chat()).id
    : undefined

  delete meta._

  await storage.generatedMedia.create({
    data: {
      type,
      mime,
      meta,
      authorId,
      chatId,
      sourceFileId,
      resultFileId,
      resultFileUniqueId,
      publicId: id,
      content: text
    }
  })
}

function detectMIME (ctx: MyContext) {
  const { msg } = ctx
  for (const key in msg) {
    if (key.toUpperCase() in MediaMIME) {
      return key.toUpperCase() as MediaMIME
    }
  }
  return 'PHOTO'
}
