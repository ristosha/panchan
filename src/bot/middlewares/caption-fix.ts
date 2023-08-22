import { type NextFunction } from 'grammy'

export async function captionFix (ctx, next: NextFunction) {
  if (ctx.message?.caption != null) {
    ctx.message.text = ctx.message.caption
  }

  // if (ctx.message != null && ctx.msg?.caption_entities != null && ctx.msg.entities == null) {
  //   ctx.message.text = ctx.msg.caption
  //   ctx.msg.text = ctx.msg.caption
  //   ctx.msg.entities = ctx.msg.caption_entities
  // }

  await next()
}
