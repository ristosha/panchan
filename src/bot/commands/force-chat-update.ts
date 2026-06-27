import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { refreshChat } from './chat-refresh'

/** `/force_chat_update` (alias `/refresh`) — re-sync chat info + caller membership. */
export const forceChatUpdate = new Composer<MyContext>()
const command = forceChatUpdate.command(['force_chat_update', 'refresh'])

command.chatType(['private', 'channel'], async ctx => {
	await ctx.reply(ctx.t('command-force-chat-update.private-chat'))
})

command.chatType(['group', 'supergroup'], async ctx => {
	await refreshChat(ctx, true)
	await ctx.reply(ctx.t('command-force-chat-update'))
})
