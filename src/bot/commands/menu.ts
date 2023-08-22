import { Composer } from 'grammy'

import { bot } from '~/bot/index.js'
import { generalMenu } from '~/bot/layouts/general.js'
import runCommandInPrivate from '~/bot/middlewares/run-command-in-private.js'
import { type MyContext } from '~/bot/types/context.js'

export const menu = new Composer<MyContext>()
const command = menu.command(['menu', 'start', 'restart'])

command.use(async (ctx, next) => {
  if (ctx.match?.startsWith('command-')) {
    const update = Object.create(ctx.update)
    update.message.chat = { type: 'private', id: ctx.from?.id }
    update.message.text = '/' + ctx.match.substring(8)
    await bot.handleUpdate(update)
    return
  }

  await next()
})

command.chatType(['group', 'channel', 'supergroup'], runCommandInPrivate('command-menu'))

command.use(async (ctx) => {
  await generalMenu.replyToContext(ctx)
})
