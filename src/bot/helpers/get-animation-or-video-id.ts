import { type Message } from 'grammy/types'

export default function (ctx: Message) {
  if (ctx?.animation != null) {
    return {
      resultFileId: ctx.animation.file_id,
      resultFileUniqueId: ctx.animation.file_unique_id
    }
  } else if (ctx?.video != null) {
    return {
      resultFileId: ctx.video.file_id,
      resultFileUniqueId: ctx.video.file_unique_id
    }
  } else {
    throw Error('no media')
  }
}
