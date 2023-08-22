import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

export const forceChatUpdate = new Composer<MyContext>()
const command = forceChatUpdate.command([
  'force_chat_update', 'refresh'
])

command.chatType(['private', 'channel'], async (ctx) => {
  await ctx.reply(ctx.t('command-force-chat-update.private-chat'))
})

command.use(async (ctx) => {
  if (ctx.state.chat != null) {
    await ctx.state.chat(true)
    if (ctx.state.chatMember != null) {
      await ctx.state.chatMember(true)
    }

    await ctx.reply(ctx.t('command-force-chat-update'))
  }
})
