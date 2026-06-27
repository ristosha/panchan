import { and, desc, eq, exists, getTableColumns, inArray, sql } from 'drizzle-orm'

import type { Database } from '@/platform/database'
import {
	channel,
	chatEnabledPacks,
	chatMembers,
	chats,
	generatedMedia,
} from '@/platform/database/schema'

type ChatMemberRole = (typeof chatMembers.$inferSelect)['role']

const ADMIN_ROLES = ['ADMIN', 'CREATOR'] as const

export function createChatsRepository(db: Database) {
	return {
		// set-chat.ts upsert: create the chat and connect the default packs, no-op on conflict.
		// Pass default pack ids in from packs.getDefaultIds() rather than re-querying internally.
		async upsert(telegramId: bigint, title: string | null, defaultPackIds: number[] = []) {
			return db.transaction(async tx => {
				const [inserted] = await tx
					.insert(chats)
					.values({ telegramId, title })
					.onConflictDoNothing({ target: chats.telegramId })
					.returning()

				if (!inserted) {
					const existing = await tx.query.chats.findFirst({
						where: eq(chats.telegramId, telegramId),
					})
					return existing!
				}

				if (defaultPackIds.length > 0) {
					await tx
						.insert(chatEnabledPacks)
						.values(defaultPackIds.map(id => ({ a: inserted.id, b: id })))
						.onConflictDoNothing()
				}

				return inserted
			})
		},

		// set-chat.ts periodic refresh of title + member count
		async updateInfo(telegramId: bigint, data: { title?: string | null; memberCount?: number }) {
			await db
				.update(chats)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(chats.telegramId, telegramId))
		},

		// get-chats.ts getOwnChats — chats the user administrates, each with its enabled pack ids
		async getOwnWithPacks(userId: number) {
			const rows = await db.query.chats.findMany({
				where: exists(
					db
						.select({ one: sql`1` })
						.from(chatMembers)
						.where(
							and(
								eq(chatMembers.chatId, chats.id),
								eq(chatMembers.userId, userId),
								inArray(chatMembers.role, [...ADMIN_ROLES]),
							),
						),
				),
				with: { enabledPacks: { columns: { b: true } } },
			})
			return rows.map(c => ({ ...c, packs: c.enabledPacks.map(p => ({ id: p.b })) }))
		},

		// install-chat-list.ts — toggle a pack in a chat, guarded by admin/creator membership.
		// Returns false when the user isn't allowed (mirrors the old `members.some(...)` guard).
		async setPackEnabled(chatId: number, packId: number, userId: number, enabled: boolean) {
			const allowed = await db
				.select({ one: sql`1` })
				.from(chatMembers)
				.where(
					and(
						eq(chatMembers.chatId, chatId),
						eq(chatMembers.userId, userId),
						inArray(chatMembers.role, [...ADMIN_ROLES]),
					),
				)
				.limit(1)
			if (allowed.length === 0) return false

			if (enabled) {
				await db.insert(chatEnabledPacks).values({ a: chatId, b: packId }).onConflictDoNothing()
			} else {
				await db
					.delete(chatEnabledPacks)
					.where(and(eq(chatEnabledPacks.a, chatId), eq(chatEnabledPacks.b, packId)))
			}
			return true
		},

		// stats.ts
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(chats)
			return r?.count ?? 0
		},

		async getTopByMembers(limit = 5) {
			return db
				.select({
					...getTableColumns(chats),
					memberRows: sql<number>`(select count(*)::int from ${chatMembers} where ${chatMembers.chatId} = ${chats.id})`,
					mediaCount: sql<number>`(select count(*)::int from ${generatedMedia} where ${generatedMedia.chatId} = ${chats.id})`,
				})
				.from(chats)
				.orderBy(desc(chats.memberCount))
				.limit(limit)
		},

		async getRecent(limit = 5) {
			return db
				.select({
					...getTableColumns(chats),
					memberRows: sql<number>`(select count(*)::int from ${chatMembers} where ${chatMembers.chatId} = ${chats.id})`,
					mediaCount: sql<number>`(select count(*)::int from ${generatedMedia} where ${generatedMedia.chatId} = ${chats.id})`,
				})
				.from(chats)
				.orderBy(desc(chats.createdAt))
				.limit(limit)
		},
	}
}

export function createChatMembersRepository(db: Database) {
	return {
		// set-chat-member.ts lookup
		async get(userId: number, chatId: number) {
			return db.query.chatMembers.findFirst({
				where: and(eq(chatMembers.userId, userId), eq(chatMembers.chatId, chatId)),
			})
		},

		// set-chat-member.ts upsert (unique on user_id + chat_id)
		async upsert(userId: number, chatId: number, role: ChatMemberRole) {
			const [member] = await db
				.insert(chatMembers)
				.values({ userId, chatId, role })
				.onConflictDoUpdate({
					target: [chatMembers.userId, chatMembers.chatId],
					set: { role, updatedAt: new Date() },
				})
				.returning()
			return member!
		},

		// set-chat-member.ts — member left/kicked
		async deleteById(id: number) {
			await db.delete(chatMembers).where(eq(chatMembers.id, id))
		},

		// stats.ts
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(chatMembers)
			return r?.count ?? 0
		},
	}
}

export function createChannelsRepository(db: Database) {
	return {
		// set-channel.ts
		async getByTelegramId(telegramId: bigint) {
			return db.query.channel.findFirst({ where: eq(channel.telegramId, telegramId) })
		},

		async upsert(
			telegramId: bigint,
			data: {
				title?: string | null
				creatorTelegramId?: bigint | null
				adminsTelegramIds?: bigint[]
			},
		) {
			const [row] = await db
				.insert(channel)
				.values({
					telegramId,
					title: data.title ?? null,
					creatorTelegramId: data.creatorTelegramId ?? null,
					adminsTelegramIds: data.adminsTelegramIds ?? [],
				})
				.onConflictDoUpdate({
					target: channel.telegramId,
					set: {
						title: data.title ?? null,
						creatorTelegramId: data.creatorTelegramId ?? null,
						adminsTelegramIds: data.adminsTelegramIds ?? [],
						updatedAt: new Date(),
					},
				})
				.returning()
			return row!
		},

		async updateMemberCount(telegramId: bigint, memberCount: number) {
			await db
				.update(channel)
				.set({ memberCount, updatedAt: new Date() })
				.where(eq(channel.telegramId, telegramId))
		},
	}
}
