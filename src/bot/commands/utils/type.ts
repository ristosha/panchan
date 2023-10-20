import { type Middleware } from 'grammy'

export const type: Middleware = async (ctx, next) => {
  void ctx.replyWithChatAction('choose_sticker').catch()
  await next()
}
