import { InlineKeyboard, type Middleware } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

export default function (command: string): Middleware<MyContext> {
  return async (ctx, next) => {
    const keyboard = new InlineKeyboard()
      .url(ctx.t('command-no-private.go'), `t.me/${ctx.me.username}?start=${command}`)

    await ctx.reply(ctx.t('command-no-private'), { reply_markup: keyboard })
  }
}
