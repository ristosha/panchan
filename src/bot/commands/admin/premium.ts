import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const premium = new Composer<MyContext>()
const command = premium.command('premium')

command
  .on('message')
  .filter(c => c.message.reply_to_message != null)
  .use(async ctx => {
    const userId = ctx.msg.reply_to_message?.from?.id
    if (userId == null) {
      await ctx.reply('Undefined user id')
      return
    }

    const user = await storage.user.findFirst({
      where: {
        telegramId: userId
      }
    })

    if (user == null) {
      await ctx.reply('User has no interactions with the bot')
      return
    }

    await storage.user.update({
      where: { id: user.id },
      data: {
        premium: !user.premium
      }
    })

    await ctx.reply(`Premium is \`${String(!user.premium)}\` now`)
  })
