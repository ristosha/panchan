import { lt } from 'drizzle-orm'

import type { Database } from '@/platform/database'
import { generatedMediaUses, sessions } from '@/platform/database/schema'

const DAY_MS = 24 * 60 * 60 * 1000

// Sessions themselves are owned by the grammY storage adapter (src/bot/core/session-storage.ts);
// this repository only provides the retention/pruning entry points used by the cleanup script.
export function createMaintenanceRepository(db: Database) {
	return {
		// drops abandoned grammY sessions (the 45k-row bloat) by their updated_at TTL
		async pruneSessions(olderThanDays: number) {
			const cutoff = new Date(Date.now() - olderThanDays * DAY_MS)
			const deleted = await db
				.delete(sessions)
				.where(lt(sessions.updatedAt, cutoff))
				.returning({ key: sessions.key })
			return deleted.length
		},

		// trims the ever-growing usage log; media rows themselves are kept
		async pruneMediaUses(olderThanDays: number) {
			const cutoff = new Date(Date.now() - olderThanDays * DAY_MS)
			const deleted = await db
				.delete(generatedMediaUses)
				.where(lt(generatedMediaUses.createdAt, cutoff))
				.returning({ id: generatedMediaUses.id })
			return deleted.length
		},
	}
}
