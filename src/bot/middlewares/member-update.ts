import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

export const memberUpdate = new Composer<MyContext>()

memberUpdate.on('chat_member:from', async (ctx, next) => {
  if (ctx.state.chat != null && ctx.state.chatMember != null) {
    await ctx.state.chat(true)
    await ctx.state.chatMember(true)
  }
  await next()
})
