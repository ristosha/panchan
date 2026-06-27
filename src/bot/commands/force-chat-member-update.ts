import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { refreshChat } from './chat-refresh'

/** `/force_chat_member_update` — re-sync only the caller's membership in this chat. */
export const forceChatMemberUpdate = new Composer<MyContext>()
const command = forceChatMemberUpdate.command('force_chat_member_update')

command.chatType(['private', 'channel'], async ctx => {
	await ctx.reply(ctx.t('command-force-chat-update.private-chat'))
})

command.chatType(['group', 'supergroup'], async ctx => {
	await refreshChat(ctx, false)
	await ctx.reply(ctx.t('command-force-chat-update'))
})
