import { type NextFunction } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

const keys = ['photo', 'video', 'document', 'animation', 'sticker', 'video_note']

export async function replyMediaMerge (ctx: MyContext, next: NextFunction) {
  if (ctx.msg?.reply_to_message != null) {
    const reply = ctx.msg.reply_to_message
    for (const key of keys) {
      if (key in reply && (!(key in ctx.msg) || ctx.msg[key] == null)) {
        ctx.msg[key] = reply[key]
      }
    }
  }
  await next()
}
