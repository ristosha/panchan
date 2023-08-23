import { type GeneratedMediaType, MediaMIME } from '@prisma/client'

import { type MyContext } from '~/bot/types/context.js'
import { storage, type StorageTypes } from '~/storage.js'

export interface SaveMediaParams {
  ctx: MyContext
  type: GeneratedMediaType
  id: string
  sourceFileId: string
  resultFileId: string
  resultFileUniqueId: string
  randomElements?: number[]
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
    randomElements = undefined,
    mime = detectMIME(ctx)
  } = params

  const authorId = (await ctx.state.user()).id
  const chatId = ctx.state.chat != null
    ? (await ctx.state.chat()).id
    : undefined

  delete meta._

  const data: StorageTypes.GeneratedMediaCreateArgs = {
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
  }

  if (randomElements != null && Array.isArray(randomElements) && randomElements.length > 0) {
    data.data.linkedPackElements = {
      connect: randomElements.map(e => ({ id: e }))
    }
  }

  await storage.generatedMedia.create(data)
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
