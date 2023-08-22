import { type PackElementType } from '@prisma/client'

import { type MyContext } from '~/bot/types/context.js'

export function extractMatch (ctx: MyContext) {
  if (ctx.callbackQuery?.data != null) {
    return ctx.callbackQuery.data
  } else if (typeof ctx.match === 'string' && ctx.match.length > 0) {
    return ctx.match
  } else if (ctx.match != null) {
    return ctx.match[0]
  }
  return null
}

export function extractId (ctx: MyContext) {
  const content = ctx.match as string ?? ctx.msg?.caption ?? ctx.msg?.text ?? ''
  const split = content.split(' ')
  const sliceId = content.startsWith('/') ? 1 : 0
  const rawId = content.startsWith('/') ? split[sliceId] : split[sliceId]
  return { id: parseInt(rawId), content: split.slice(sliceId + 1, 300).join(' ') }
}

export function extractMedia (ctx: MyContext) {
  let fileId: string | undefined
  let type: PackElementType = 'PHOTO'
  if ((ctx.msg?.animation) != null) {
    fileId = ctx.msg.animation.file_id
    type = 'ANIMATION'
  } else if ((ctx.msg?.video) != null) {
    fileId = ctx.msg.video.file_id
    type = 'VIDEO'
  } else if ((ctx.msg?.photo) != null) {
    fileId = ctx.msg.photo.at(-1)?.file_id
    type = 'PHOTO'
  }

  return { fileId, type }
}

export function extractMediaExtended (ctx: MyContext) {
  let fileId: string | undefined
  let uniqueFileId: string | undefined
  let isVideo: boolean | undefined
  let type: PackElementType = 'PHOTO'
  if ((ctx.msg?.animation) != null) {
    fileId = ctx.msg.animation.file_id
    uniqueFileId = ctx.msg.animation.file_unique_id
    type = 'ANIMATION'
  } else if ((ctx.msg?.video) != null) {
    fileId = ctx.msg.video.file_id
    uniqueFileId = ctx.msg.video.file_unique_id
    type = 'VIDEO'
  } else if ((ctx.msg?.photo) != null) {
    fileId = ctx.msg.photo.at(-1)?.file_id
    uniqueFileId = ctx.msg.photo.at(-1)?.file_unique_id
    type = 'PHOTO'
  } else if ((ctx.msg?.sticker) != null) {
    fileId = ctx.msg.sticker.file_id
    uniqueFileId = ctx.msg.sticker.file_unique_id
    type = 'STICKER'
    isVideo = ctx.msg.sticker.is_video
  } else if ((ctx.msg?.video_note) != null) {
    fileId = ctx.msg.video_note.file_id
    uniqueFileId = ctx.msg.video_note.file_unique_id
  }

  return { fileId, type, uniqueFileId, isVideo }
}
