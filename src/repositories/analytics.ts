import { sql } from 'drizzle-orm'

import type { Database } from '@/platform/database'

export interface TypeRow {
	type: string
	gens: number
	uses: number
}
export interface MonthRow {
	m: string
	uses: number
	uu: number
}

/**
 * Activity-oriented analytics for the admin `/stats` command. The legacy stats
 * only had all-time counters; these add the "is the bot actually being used"
 * signal (time-windowed uses/active users, trend, per-generator usage).
 *
 * Counts are cast to ::int in SQL so the driver returns numbers, not bigint
 * strings. `generated_media_uses.createdAt` is a real timestamp (precise);
 * `generated_media.created_at` is day-granular for legacy rows (fine for windows).
 */
export function createAnalyticsRepository(db: Database) {
	return {
		async overview() {
			const [activity, active, gens, byType, fronts, monthly] = await Promise.all([
				db.execute(sql`
					SELECT
						count(*) FILTER (WHERE "createdAt" > now() - interval '1 day')::int   AS uses_24h,
						count(*) FILTER (WHERE "createdAt" > now() - interval '7 days')::int  AS uses_7d,
						count(*) FILTER (WHERE "createdAt" > now() - interval '30 days')::int AS uses_30d,
						count(DISTINCT used_by_telegram_id) FILTER (WHERE "createdAt" > now() - interval '1 day')::int   AS uu_24h,
						count(DISTINCT used_by_telegram_id) FILTER (WHERE "createdAt" > now() - interval '7 days')::int  AS uu_7d,
						count(DISTINCT used_by_telegram_id) FILTER (WHERE "createdAt" > now() - interval '30 days')::int AS uu_30d,
						count(DISTINCT chat_id) FILTER (WHERE "createdAt" > now() - interval '7 days')::int AS chats_7d
					FROM generated_media_uses
				`),
				db.execute(sql`
					SELECT
						count(*) FILTER (WHERE act > now() - interval '7 days')::int  AS a7,
						count(*) FILTER (WHERE act > now() - interval '30 days')::int AS a30,
						count(*) FILTER (WHERE act > now() - interval '90 days')::int AS a90
					FROM (
						SELECT greatest(coalesce("lastGroupContactedAt", 'epoch'), coalesce("lastPrivateContactedAt", 'epoch')) AS act
						FROM users
					) s
				`),
				db.execute(sql`
					SELECT
						count(*) FILTER (WHERE created_at > now() - interval '7 days')::int  AS g7,
						count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS g30
					FROM generated_media
				`),
				db.execute(sql`
					SELECT gm.type AS type, count(DISTINCT gm.id)::int AS gens, count(u.id)::int AS uses
					FROM generated_media gm
					LEFT JOIN generated_media_uses u ON u.generated_media_id = gm.id
					GROUP BY gm.type ORDER BY uses DESC
				`),
				db.execute(sql`
					SELECT (chat_id IS NULL) AS is_private, count(*)::int AS n
					FROM generated_media GROUP BY 1
				`),
				db.execute(sql`
					SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS m,
						count(*)::int AS uses, count(DISTINCT used_by_telegram_id)::int AS uu
					FROM generated_media_uses GROUP BY 1 ORDER BY 1 DESC LIMIT 6
				`),
			])

			const frontRows = fronts as unknown as Array<{ is_private: boolean; n: number }>
			return {
				activity: activity[0] as unknown as {
					uses_24h: number
					uses_7d: number
					uses_30d: number
					uu_24h: number
					uu_7d: number
					uu_30d: number
					chats_7d: number
				},
				active: active[0] as unknown as { a7: number; a30: number; a90: number },
				gens: gens[0] as unknown as { g7: number; g30: number },
				byType: byType as unknown as TypeRow[],
				private: frontRows.find(f => f.is_private)?.n ?? 0,
				group: frontRows.find(f => !f.is_private)?.n ?? 0,
				monthly: monthly as unknown as MonthRow[],
			}
		},
	}
}
