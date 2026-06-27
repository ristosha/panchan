import type { SQL } from 'drizzle-orm'
import { and, desc, eq, exists, inArray, notExists, or, sql } from 'drizzle-orm'

import type { Database } from '@/platform/database'
import {
	chatMembers,
	generatedMedia,
	generatedMediaUses,
	linkedPackElements,
	packElements,
	users,
} from '@/platform/database/schema'

type MediaType = (typeof generatedMedia.$inferSelect)['type']
type MediaMime = (typeof generatedMedia.$inferSelect)['mime']
type ElementKind = (typeof packElements.$inferSelect)['type']

export interface MediaChainElement {
	id: number
	type: MediaType
	mime: MediaMime
	content: string | null
	source_file_id: string
	result_file_id: string
	meta: Record<string, unknown>
	created_at: Date
	a_anonymous: boolean
	a_username: string | null
	use_count: number
}

export interface InlineSearchParams {
	telegramId: bigint
	limit?: number
	offset?: number
	elementTypes?: ElementKind[]
	term?: string
	sortByDate?: boolean
	/** Admin-only: bypass the visibility filter (search across ALL chats). */
	all?: boolean
}

function toRows<T>(res: unknown): T[] {
	return Array.isArray(res) ? (res as T[]) : ((res as { rows?: T[] }).rows ?? [])
}

export function createMediaRepository(db: Database) {
	return {
		// handle-usage.ts hot path (audit fixes #1 + #2): indexed lookup by result_file_unique_id,
		// selecting only the id we actually need.
		async findIdByResultFileUniqueId(uniqueId: string) {
			const [row] = await db
				.select({ id: generatedMedia.id })
				.from(generatedMedia)
				.where(eq(generatedMedia.resultFileUniqueId, uniqueId))
				.limit(1)
			return row ?? null
		},

		// handle-usage.ts — record a use (was a nested prisma `uses: { create }`)
		async recordUse(generatedMediaId: number, chatId: number | null, usedByTelegramId: bigint) {
			await db.insert(generatedMediaUses).values({ generatedMediaId, chatId, usedByTelegramId })
		},

		// get-original-media.ts — only source_file_id is actually consumed (feeds getMediaChain)
		async findSourceFileIdForOriginal(resultFileUniqueId: string, publicId?: string) {
			const match =
				publicId != null
					? or(
							eq(generatedMedia.resultFileUniqueId, resultFileUniqueId),
							eq(generatedMedia.publicId, publicId),
						)
					: eq(generatedMedia.resultFileUniqueId, resultFileUniqueId)
			const [row] = await db
				.select({ sourceFileId: generatedMedia.sourceFileId })
				.from(generatedMedia)
				.where(match)
				.limit(1)
			return row ?? null
		},

		// duped-request.ts — only id + resultFileId are used
		async findDupe(type: MediaType, sourceFileId: string) {
			const [row] = await db
				.select({ id: generatedMedia.id, resultFileId: generatedMedia.resultFileId })
				.from(generatedMedia)
				.where(and(eq(generatedMedia.type, type), eq(generatedMedia.sourceFileId, sourceFileId)))
				.limit(1)
			return row ?? null
		},

		// save-media.ts — create media and (optionally) connect linked pack elements
		async create(data: typeof generatedMedia.$inferInsert, linkedElementIds: number[] = []) {
			return db.transaction(async tx => {
				const [media] = await tx.insert(generatedMedia).values(data).returning()
				if (linkedElementIds.length > 0) {
					await tx
						.insert(linkedPackElements)
						.values(linkedElementIds.map(id => ({ a: media!.id, b: id })))
						.onConflictDoNothing()
				}
				return media!
			})
		},

		// handle-search.ts inline query (audit fixes #2 + #6). Selects only mime + resultFileId.
		// Visibility OR: media in a chat the user belongs to / used by the user / used in a chat
		// the user belongs to. Optional element-type and russian full-text filters.
		async searchInline(params: InlineSearchParams) {
			const {
				telegramId,
				limit = 30,
				offset = 0,
				elementTypes,
				term,
				sortByDate = false,
				all = false,
			} = params

			const visible = or(
				exists(
					db
						.select({ one: sql`1` })
						.from(chatMembers)
						.innerJoin(users, eq(users.id, chatMembers.userId))
						.where(
							and(eq(chatMembers.chatId, generatedMedia.chatId), eq(users.telegramId, telegramId)),
						),
				),
				exists(
					db
						.select({ one: sql`1` })
						.from(generatedMediaUses)
						.where(
							and(
								eq(generatedMediaUses.generatedMediaId, generatedMedia.id),
								eq(generatedMediaUses.usedByTelegramId, telegramId),
							),
						),
				),
				exists(
					db
						.select({ one: sql`1` })
						.from(generatedMediaUses)
						.innerJoin(chatMembers, eq(chatMembers.chatId, generatedMediaUses.chatId))
						.innerJoin(users, eq(users.id, chatMembers.userId))
						.where(
							and(
								eq(generatedMediaUses.generatedMediaId, generatedMedia.id),
								eq(users.telegramId, telegramId),
							),
						),
				),
			)

			const conditions: (SQL | undefined)[] = [
				inArray(generatedMedia.mime, ['PHOTO', 'ANIMATION']),
				// author.searchIncluded === true (implies the author still exists)
				exists(
					db
						.select({ one: sql`1` })
						.from(users)
						.where(and(eq(users.id, generatedMedia.authorId), eq(users.searchIncluded, true))),
				),
			]

			// non-admins only see media from chats they're in / have used; `-all` (admin) skips this
			if (!all) conditions.push(visible)

			if (elementTypes && elementTypes.length > 0) {
				conditions.push(
					exists(
						db
							.select({ one: sql`1` })
							.from(linkedPackElements)
							.innerJoin(packElements, eq(packElements.id, linkedPackElements.b))
							.where(
								and(
									eq(linkedPackElements.a, generatedMedia.id),
									inArray(packElements.type, elementTypes),
								),
							),
					),
				)
			}

			if (term && term.trim().length > 0) {
				conditions.push(
					sql`to_tsvector('russian', coalesce(${generatedMedia.content}, '')) @@ plainto_tsquery('russian', ${term})`,
				)
			}

			const usesCount = sql<number>`(select count(*) from ${generatedMediaUses} where ${generatedMediaUses.generatedMediaId} = ${generatedMedia.id})`

			return db
				.select({ mime: generatedMedia.mime, resultFileId: generatedMedia.resultFileId })
				.from(generatedMedia)
				.where(and(...conditions))
				.orderBy(sortByDate ? desc(generatedMedia.createdAt) : desc(usesCount))
				.limit(limit)
				.offset(offset)
		},

		// media-chain.ts — recursive walk forward from a source file id
		async getMediaChain(sourceFileId: string) {
			const res = await db.execute(sql`
				WITH RECURSIVE chain AS (
					SELECT gm.id, gm.type, gm.mime, gm.content, gm.source_file_id, gm.result_file_id,
						gm.created_at, gm.meta,
						author.anonymous AS a_anonymous, author.username AS a_username,
						(SELECT COUNT(*) FROM generated_media_uses gmu WHERE gmu.generated_media_id = gm.id) AS use_count
					FROM generated_media gm
					LEFT JOIN users author ON author.id = gm.author_id
					WHERE gm.source_file_id = ${sourceFileId}
					UNION ALL
					(SELECT gm.id, gm.type, gm.mime, gm.content, gm.source_file_id, gm.result_file_id,
						gm.created_at, gm.meta,
						author.anonymous AS a_anonymous, author.username AS a_username,
						(SELECT COUNT(*) FROM generated_media_uses gmu WHERE gmu.generated_media_id = gm.id) AS use_count
					FROM generated_media gm
					LEFT JOIN users author ON author.id = gm.author_id
					JOIN chain c ON c.source_file_id = gm.result_file_id)
				)
				SELECT * FROM chain
			`)
			return toRows<MediaChainElement>(res)
		},

		// media-chain.ts — same walk, seeded by media id
		async getMediaChainById(id: number) {
			const res = await db.execute(sql`
				WITH RECURSIVE chain AS (
					SELECT gm.id, gm.type, gm.mime, gm.content, gm.source_file_id, gm.result_file_id,
						gm.created_at, gm.meta,
						author.anonymous AS a_anonymous, author.username AS a_username,
						(SELECT COUNT(*) FROM generated_media_uses gmu WHERE gmu.generated_media_id = gm.id) AS use_count
					FROM generated_media gm
					LEFT JOIN users author ON author.id = gm.author_id
					WHERE gm.id = ${id}
					UNION ALL
					(SELECT gm.id, gm.type, gm.mime, gm.content, gm.source_file_id, gm.result_file_id,
						gm.created_at, gm.meta,
						author.anonymous AS a_anonymous, author.username AS a_username,
						(SELECT COUNT(*) FROM generated_media_uses gmu WHERE gmu.generated_media_id = gm.id) AS use_count
					FROM generated_media gm
					LEFT JOIN users author ON author.id = gm.author_id
					JOIN chain c ON c.source_file_id = gm.result_file_id)
				)
				SELECT * FROM chain
			`)
			return toRows<MediaChainElement>(res)
		},

		// stats.ts counters
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(generatedMedia)
			return r?.count ?? 0
		},

		async countByType(type: MediaType) {
			const [r] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(generatedMedia)
				.where(eq(generatedMedia.type, type))
			return r?.count ?? 0
		},

		// media with no linked pack elements ("non-random")
		async countNonRandom() {
			const [r] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(generatedMedia)
				.where(
					notExists(
						db
							.select({ one: sql`1` })
							.from(linkedPackElements)
							.where(eq(linkedPackElements.a, generatedMedia.id)),
					),
				)
			return r?.count ?? 0
		},

		async countUses() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(generatedMediaUses)
			return r?.count ?? 0
		},
	}
}
