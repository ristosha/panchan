import { Composer } from 'grammy'

import type { ChatMemberRow, ChatRow, MyContext } from '@/bot/types/context'

export const memberUpdate = new Composer<MyContext>()

// On a chat_member update for the acting user, force-refresh the cached chat +
// membership (role may have changed). The getters accept an internal `force`
// flag not present on the public StateFlavor type, hence the casts.
memberUpdate.on('chat_member:from', async (ctx, next) => {
	const chat = ctx.state.chat as undefined | ((force?: boolean) => Promise<ChatRow>)
	const chatMember = ctx.state.chatMember as
		| undefined
		| ((force?: boolean) => Promise<ChatMemberRow>)
	if (chat != null && chatMember != null) {
		await chat(true).catch(() => {})
		await chatMember(true).catch(() => {})
	}
	await next()
})
