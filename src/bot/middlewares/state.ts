import type { MiddlewareFn } from 'grammy'

import { getDefaultPackIds } from '@/bot/helpers/default-packs'
import type { ChannelRow, ChatMemberRow, ChatRow, MyContext, UserRow } from '@/bot/types/context'

const ONE_DAY = 24 * 60 * 60 * 1000
// AUDIT FIX #4: don't write activity timestamps on every update — only when the
// last recorded contact is missing or older than this.
const ACTIVITY_STALE_MS = 10 * 60 * 1000

const ROLE_MAP: Record<string, ChatMemberRow['role']> = {
	creator: 'CREATOR',
	administrator: 'ADMIN',
	member: 'MEMBER',
	restricted: 'MEMBER',
}

/** Thrown by the chatMember getter when the user has left/been kicked. */
export class ChatMemberRemoved extends Error {
	constructor() {
		super('Requested member was removed from the chat')
		this.name = 'ChatMemberRemoved'
	}
}

type ForceGetter<T> = (force?: boolean) => Promise<T>

function createUserGetter(ctx: MyContext): ForceGetter<UserRow> {
	const { repos, config } = ctx.deps
	const from = ctx.from!
	const telegramId = BigInt(from.id)
	const chatType = ctx.chat?.type
	const scope: 'group' | 'private' | null =
		chatType === 'group' || chatType === 'supergroup'
			? 'group'
			: chatType === 'private'
				? 'private'
				: null

	let cached: Promise<UserRow> | undefined
	return (force = false) => {
		if (cached != null && !force) return cached
		cached = (async () => {
			const role = config.isAdmin(from.id) ? 'ADMIN' : 'USER'
			// upsert writes IDENTITY only (username; role on create). Never activity.
			const user = await repos.users.upsert(telegramId, { username: from.username ?? null, role })

			if (scope != null) {
				const last = scope === 'group' ? user.lastGroupContactedAt : user.lastPrivateContactedAt
				if (last == null || Date.now() - last.getTime() > ACTIVITY_STALE_MS) {
					await repos.users.touchActivity(telegramId, scope)
				}
			}

			return user
		})()
		return cached
	}
}

function createChatGetter(ctx: MyContext): ForceGetter<ChatRow> {
	const { repos } = ctx.deps
	const chat = ctx.chat!
	const telegramId = BigInt(chat.id)
	const title = 'title' in chat ? (chat.title ?? null) : null

	let cached: Promise<ChatRow> | undefined
	return (force = false) => {
		if (cached != null && !force) return cached
		cached = (async () => {
			const defaultPackIds = await getDefaultPackIds(repos)
			const row = await repos.chats.upsert(telegramId, title, defaultPackIds)

			const stale = Date.now() - row.updatedAt.getTime() > ONE_DAY
			// refresh member count when forced / freshly created / once a day. Fire and
			// forget so the request isn't blocked on a getChatMemberCount round-trip.
			if (force || row.memberCount === 0 || stale) {
				void ctx
					.getChatMemberCount()
					.then(memberCount => repos.chats.updateInfo(telegramId, { title, memberCount }))
					.catch(() => {})
			}

			return row
		})()
		return cached
	}
}

function createChatMemberGetter(ctx: MyContext): ForceGetter<ChatMemberRow> {
	const { repos } = ctx.deps
	const from = ctx.from!

	let cached: Promise<ChatMemberRow> | undefined
	return (force = false) => {
		if (cached != null && !force) return cached
		cached = (async () => {
			const { id: userId } = await ctx.state.user()
			const chatGetter = ctx.state.chat
			if (chatGetter == null) throw new ChatMemberRemoved()
			const { id: chatId } = await chatGetter()

			let member = await repos.chatMembers.get(userId, chatId)
			if (member == null || force) {
				const { status } = await ctx.getChatMember(from.id)
				if (status === 'left' || status === 'kicked') {
					if (member != null) await repos.chatMembers.deleteById(member.id)
					throw new ChatMemberRemoved()
				}
				member = await repos.chatMembers.upsert(userId, chatId, ROLE_MAP[status] ?? 'MEMBER')
			}
			return member
		})()
		return cached
	}
}

async function getChatAdmins(ctx: MyContext): Promise<{
	creatorTelegramId: bigint | null
	adminsTelegramIds: bigint[]
}> {
	const info = await ctx.getChatAdministrators()
	const creator = info.find(m => m.status === 'creator')?.user.id
	const admins = info.filter(m => m.status === 'administrator').map(m => BigInt(m.user.id))
	return { creatorTelegramId: creator != null ? BigInt(creator) : null, adminsTelegramIds: admins }
}

function createChannelGetter(ctx: MyContext): ForceGetter<ChannelRow> {
	const { repos } = ctx.deps
	const chat = ctx.chat!
	const telegramId = BigInt(chat.id)
	const title = 'title' in chat ? (chat.title ?? null) : null

	let cached: Promise<ChannelRow> | undefined
	return (force = false) => {
		if (cached != null && !force) return cached
		cached = (async () => {
			let row = await repos.channels.getByTelegramId(telegramId)
			const isNew = row == null
			if (row == null || force) {
				const { creatorTelegramId, adminsTelegramIds } = await getChatAdmins(ctx)
				row = await repos.channels.upsert(telegramId, {
					title,
					creatorTelegramId,
					adminsTelegramIds,
				})
			}

			const stale = Date.now() - row.updatedAt.getTime() > ONE_DAY
			if (isNew || force || stale) {
				void ctx
					.getChatMemberCount()
					.then(memberCount => repos.channels.updateMemberCount(telegramId, memberCount))
					.catch(() => {})
			}

			return row
		})()
		return cached
	}
}

/**
 * Installs lazily-resolved, per-update memoized entity getters into `ctx.state`.
 * Ports the legacy set-user / set-chat / set-chat-member / set-channel
 * middlewares into one pass. Nothing touches the DB until a getter is called.
 */
export const stateMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
	if (ctx.from == null) return

	// ignore bots that aren't on the allow-list (parity with legacy set-user)
	if (ctx.from.is_bot && !ctx.deps.config.isAllowedBot(ctx.from.id)) return

	const chatType = ctx.chat?.type
	const state: MyContext['state'] = { user: createUserGetter(ctx) }

	if (chatType === 'group' || chatType === 'supergroup') {
		state.chat = createChatGetter(ctx)
		state.chatMember = createChatMemberGetter(ctx)
	} else if (chatType === 'channel') {
		state.channel = createChannelGetter(ctx)
	}

	ctx.state = state
	await next()
}
