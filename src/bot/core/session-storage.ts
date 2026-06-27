import { eq, sql } from 'drizzle-orm'
import type { StorageAdapter } from 'grammy'

import type { Database } from '@/platform/database'
import { sessions } from '@/platform/database'

/**
 * grammY session storage backed by Drizzle.
 *
 * Replaces @grammyjs/storage-prisma. Stores the session value as JSON text and
 * maintains `updated_at` so abandoned sessions can be TTL-pruned (the legacy
 * setup had no timestamp and grew to 45k rows). Pair with `lazySession` +
 * `getSessionKey` returning undefined for traffic that needs no persisted state
 * so junk rows are never written in the first place.
 */
export function createSessionStorage<T>(db: Database): StorageAdapter<T> {
	return {
		async read(key) {
			const row = await db
				.select({ value: sessions.value })
				.from(sessions)
				.where(eq(sessions.key, key))
				.limit(1)
			const value = row[0]?.value
			return value === undefined ? undefined : (JSON.parse(value) as T)
		},

		async write(key, value) {
			const serialized = JSON.stringify(value)
			await db
				.insert(sessions)
				.values({ key, value: serialized })
				.onConflictDoUpdate({
					target: sessions.key,
					set: { value: serialized, updatedAt: new Date() },
				})
		},

		async delete(key) {
			await db.delete(sessions).where(eq(sessions.key, key))
		},

		async has(key) {
			const row = await db
				.select({ one: sql<number>`1` })
				.from(sessions)
				.where(eq(sessions.key, key))
				.limit(1)
			return row.length > 0
		},
	}
}
