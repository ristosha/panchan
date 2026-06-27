import type { MyContext } from '@/bot/types/context'

type ChatRole = 'MEMBER' | 'ADMIN' | 'CREATOR'

function statusToRole(status: string): ChatRole {
	if (status === 'creator') return 'CREATOR'
	if (status === 'administrator') return 'ADMIN'
	return 'MEMBER'
}

/**
 * Re-sync a group's row and/or the caller's membership straight from Telegram.
 *
 * The legacy commands relied on `ctx.state.chat(true)` to force a refresh of the
 * memoised entity. The new `state` getters expose no force-refresh, so we pull the
 * live data from the Telegram API and write it through the repositories directly.
 */
export async function refreshChat(ctx: MyContext, includeChatInfo: boolean): Promise<void> {
	const chat = ctx.chat
	if (chat == null) return
	const title = 'title' in chat ? (chat.title ?? null) : null
	const tgChatId = BigInt(chat.id)

	const defaultPackIds = (await ctx.deps.repos.packs.getDefaultIds()).map(p => p.id)
	const chatRow = await ctx.deps.repos.chats.upsert(tgChatId, title, defaultPackIds)

	if (includeChatInfo) {
		const memberCount = await ctx.getChatMemberCount().catch(() => undefined)
		await ctx.deps.repos.chats.updateInfo(tgChatId, {
			title,
			...(memberCount != null ? { memberCount } : {}),
		})
	}

	const fromId = ctx.from?.id
	if (fromId == null) return
	const userId = (await ctx.state.user()).id
	const member = await ctx.getChatMember(fromId).catch(() => null)
	if (member == null) return

	if (member.status === 'left' || member.status === 'kicked') {
		const existing = await ctx.deps.repos.chatMembers.get(userId, chatRow.id)
		if (existing) await ctx.deps.repos.chatMembers.deleteById(existing.id)
	} else {
		await ctx.deps.repos.chatMembers.upsert(userId, chatRow.id, statusToRole(member.status))
	}
}
