import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

export const forceChatMemberUpdate = new Composer<MyContext>()
const command = forceChatMemberUpdate.command('force_chat_member_update')

command.chatType(['private', 'channel'], async (ctx) => {
  await ctx.reply(ctx.t('command-force-chat-update.private'))
})

command.use(async (ctx) => {
  if (ctx.state.chatMember != null) {
    await ctx.state.chatMember(true)
    await ctx.reply(ctx.t('command-force-chat-update'))
  }
})
