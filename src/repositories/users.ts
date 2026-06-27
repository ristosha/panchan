import { and, eq, isNotNull, sql } from 'drizzle-orm'

import type { Database } from '@/platform/database'
import { userCommandsPreferences, users } from '@/platform/database/schema'

type UserRole = (typeof users.$inferSelect)['role']

export function createUsersRepository(db: Database) {
	return {
		// Replaces set-user.ts upsert — but writes ONLY identity (username/role on create).
		// Activity timestamps are intentionally NOT written here; see `touchActivity`.
		async upsert(telegramId: bigint, data: { username?: string | null; role?: UserRole } = {}) {
			const [user] = await db
				.insert(users)
				.values({ telegramId, username: data.username ?? null, role: data.role ?? 'USER' })
				.onConflictDoUpdate({
					target: users.telegramId,
					set: { username: data.username ?? null, updatedAt: new Date() },
				})
				.returning()
			return user!
		},

		// Throttle point (audit fix #4): the bot layer gates how often this fires so we don't
		// write lastGroup/PrivateContactedAt on literally every message.
		async touchActivity(telegramId: bigint, scope: 'group' | 'private', at = new Date()) {
			await db
				.update(users)
				.set(scope === 'group' ? { lastGroupContactedAt: at } : { lastPrivateContactedAt: at })
				.where(eq(users.telegramId, telegramId))
		},

		// promote.ts / demote.ts / premium.ts — lookup by telegram id
		async getByTelegramId(telegramId: bigint) {
			return db.query.users.findFirst({ where: eq(users.telegramId, telegramId) })
		},

		async getById(id: number) {
			return db.query.users.findFirst({ where: eq(users.id, id) })
		},

		// privacy.ts toggles
		async setAnonymous(id: number, value: boolean) {
			await db.update(users).set({ anonymous: value }).where(eq(users.id, id))
		},

		async setSearchIncluded(id: number, value: boolean) {
			await db.update(users).set({ searchIncluded: value }).where(eq(users.id, id))
		},

		// premium.ts
		async setPremium(id: number, value: boolean) {
			await db.update(users).set({ premium: value }).where(eq(users.id, id))
		},

		// stats.ts
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(users)
			return r?.count ?? 0
		},

		async countActive(scope: 'group' | 'private') {
			const column = scope === 'group' ? users.lastGroupContactedAt : users.lastPrivateContactedAt
			const [r] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(users)
				.where(isNotNull(column))
			return r?.count ?? 0
		},

		async countPremium() {
			const [r] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(users)
				.where(eq(users.premium, true))
			return r?.count ?? 0
		},
	}
}

// UserCommandPreferences has no query in the legacy code (the bot's "preferences" menu is
// pure i18n/session UI). Exposed here for completeness; manual upsert because the table has
// no (user_id, name) unique constraint to target with onConflict.
export function createPreferencesRepository(db: Database) {
	return {
		async get(userId: number, name: string) {
			return db.query.userCommandsPreferences.findFirst({
				where: and(
					eq(userCommandsPreferences.userId, userId),
					eq(userCommandsPreferences.name, name),
				),
			})
		},

		async upsert(userId: number, name: string, preferences: Record<string, unknown>) {
			const existing = await db
				.select({ id: userCommandsPreferences.id })
				.from(userCommandsPreferences)
				.where(
					and(eq(userCommandsPreferences.userId, userId), eq(userCommandsPreferences.name, name)),
				)
				.limit(1)
			if (existing[0]) {
				await db
					.update(userCommandsPreferences)
					.set({ preferences, updatedAt: new Date() })
					.where(eq(userCommandsPreferences.id, existing[0].id))
			} else {
				await db.insert(userCommandsPreferences).values({ userId, name, preferences })
			}
		},
	}
}
