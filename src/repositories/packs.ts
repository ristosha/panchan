import type { SQL } from 'drizzle-orm'
import { and, desc, eq, exists, getTableColumns, inArray, or, sql } from 'drizzle-orm'

import type { Database } from '@/platform/database'
import {
	chatEnabledPacks,
	linkedPackElements,
	packEditingByUser,
	packElements,
	packs,
	users,
} from '@/platform/database/schema'

type PackKind = (typeof packs.$inferSelect)['type']
type ElementKind = (typeof packElements.$inferSelect)['type']

// The legacy "(authorId === me) OR (I'm an editor)" ownership predicate, used everywhere a
// user mutates / reads their own packs. Correlates the outer `packs` row.
function ownsPack(db: Database, userId: number) {
	return or(
		eq(packs.authorId, userId),
		exists(
			db
				.select({ one: sql`1` })
				.from(packEditingByUser)
				.where(and(eq(packEditingByUser.a, packs.id), eq(packEditingByUser.b, userId))),
		),
	)
}

// Same ownership check, but reached through a pack_elements row (element -> its pack).
function ownsElementPack(db: Database, userId: number) {
	return exists(
		db
			.select({ one: sql`1` })
			.from(packs)
			.where(and(eq(packs.id, packElements.packId), ownsPack(db, userId))),
	)
}

function listEditors(db: Database, packId: number) {
	return db
		.select({
			id: users.id,
			username: users.username,
			telegramId: users.telegramId,
			anonymous: users.anonymous,
		})
		.from(packEditingByUser)
		.innerJoin(users, eq(users.id, packEditingByUser.b))
		.where(eq(packEditingByUser.a, packId))
}

async function fetchPackDetails(db: Database, where: SQL | undefined) {
	const pack = await db.query.packs.findFirst({
		where,
		with: {
			author: { columns: { id: true, username: true, anonymous: true } },
			editors: {
				with: {
					user: {
						columns: { id: true, username: true, anonymous: true, telegramId: true },
					},
				},
			},
		},
	})
	if (!pack) return null

	const [counts] = await db
		.select({
			elements: sql<number>`(select count(*)::int from ${packElements} where ${packElements.packId} = ${packs.id})`,
			usedInChats: sql<number>`(select count(*)::int from ${chatEnabledPacks} where ${chatEnabledPacks.b} = ${packs.id})`,
		})
		.from(packs)
		.where(eq(packs.id, pack.id))

	const { editors, ...rest } = pack
	return {
		...rest,
		editors: editors.map(e => e.user),
		elementsCount: counts?.elements ?? 0,
		usedInChatsCount: counts?.usedInChats ?? 0,
	}
}

export function createPacksRepository(db: Database) {
	return {
		// set-chat.ts (default packs to connect) + set-default.ts (cache refresh)
		async getDefaultIds() {
			return db.select({ id: packs.id }).from(packs).where(eq(packs.default, true))
		},

		// set-default.ts
		async getById(id: number) {
			return db.query.packs.findFirst({ where: eq(packs.id, id) })
		},

		// add-as-json.ts
		async getByIdAndType(id: number, type: PackKind) {
			return db.query.packs.findFirst({ where: and(eq(packs.id, id), eq(packs.type, type)) })
		},

		// auto-uploader.ts
		async getDefaultByType(type: PackKind) {
			return db.query.packs.findFirst({
				where: and(eq(packs.type, type), eq(packs.default, true)),
			})
		},

		// add-element.ts ownership/type check
		async findOwnPack(id: number, userId: number) {
			return db.query.packs.findFirst({ where: and(eq(packs.id, id), ownsPack(db, userId)) })
		},

		// get-packs.ts getOwnPacks
		async getOwnPacks(type: PackKind, userId: number) {
			return db
				.select({ id: packs.id, name: packs.name, default: packs.default, tags: packs.tags })
				.from(packs)
				.where(and(eq(packs.type, type), ownsPack(db, userId)))
		},

		// get-packs.ts getPublicPacks — default first, then by install count
		async getPublicPacks(type: PackKind) {
			const installs = sql<number>`(select count(*) from ${chatEnabledPacks} where ${chatEnabledPacks.b} = ${packs.id})`
			return db
				.select({ id: packs.id, name: packs.name, default: packs.default, tags: packs.tags })
				.from(packs)
				.where(and(eq(packs.type, type), or(eq(packs.default, true), eq(packs.private, false))))
				.orderBy(desc(packs.default), desc(installs))
		},

		// stats.ts mostInstalledPacks
		async getMostInstalled(limit = 10) {
			const installs = sql<number>`(select count(*)::int from ${chatEnabledPacks} where ${chatEnabledPacks.b} = ${packs.id})`
			return db
				.select({ id: packs.id, name: packs.name, installCount: installs })
				.from(packs)
				.orderBy(desc(installs))
				.limit(limit)
		},

		// get-packs.ts getOwnPackById (promote/demote also consume this)
		async getOwnPackById(id: number, userId: number) {
			return fetchPackDetails(db, and(eq(packs.id, id), ownsPack(db, userId)))
		},

		// get-packs.ts getPublicPackById
		async getPublicPackById(id: number) {
			return fetchPackDetails(
				db,
				and(eq(packs.id, id), or(eq(packs.default, true), eq(packs.private, false))),
			)
		},

		// create-pack.ts
		async create(data: { name: string; type: PackKind; authorId: number }) {
			const [pack] = await db.insert(packs).values(data).returning()
			return pack!
		},

		// edit-pack-privacy.ts
		async setPrivacy(id: number, userId: number, isPrivate: boolean) {
			const updated = await db
				.update(packs)
				.set({ private: isPrivate })
				.where(and(eq(packs.id, id), ownsPack(db, userId)))
				.returning({ id: packs.id })
			return updated.length > 0
		},

		// edit-pack-description.ts read
		async getDescription(id: number) {
			const [row] = await db
				.select({ description: packs.description })
				.from(packs)
				.where(eq(packs.id, id))
				.limit(1)
			return row ?? null
		},

		// edit-pack-description.ts write
		async setDescription(id: number, userId: number, description: string | null) {
			const updated = await db
				.update(packs)
				.set({ description })
				.where(and(eq(packs.id, id), ownsPack(db, userId)))
				.returning({ id: packs.id })
			return updated.length > 0
		},

		// edit-pack-nsfw.ts (tags: { set: [...] })
		async setTags(id: number, userId: number, tags: string[]) {
			const updated = await db
				.update(packs)
				.set({ tags })
				.where(and(eq(packs.id, id), ownsPack(db, userId)))
				.returning({ id: packs.id })
			return updated.length > 0
		},

		// set-default.ts
		async setDefault(id: number, value: boolean) {
			await db.update(packs).set({ default: value }).where(eq(packs.id, id))
		},

		// delete-pack.ts
		async deleteOwn(id: number, userId: number) {
			const deleted = await db
				.delete(packs)
				.where(and(eq(packs.id, id), ownsPack(db, userId)))
				.returning({ id: packs.id })
			return deleted.length > 0
		},

		// editors (packEditingByUser M2M)
		async getEditors(packId: number) {
			return listEditors(db, packId)
		},

		// promote.ts — only the pack author can promote; returns the new editor list
		async addEditor(packId: number, authorId: number, editorUserId: number) {
			const [owner] = await db
				.select({ id: packs.id })
				.from(packs)
				.where(and(eq(packs.id, packId), eq(packs.authorId, authorId)))
				.limit(1)
			if (!owner) return null
			await db
				.insert(packEditingByUser)
				.values({ a: packId, b: editorUserId })
				.onConflictDoNothing()
			return listEditors(db, packId)
		},

		// demote.ts
		async removeEditor(packId: number, authorId: number, editorUserId: number) {
			const [owner] = await db
				.select({ id: packs.id })
				.from(packs)
				.where(and(eq(packs.id, packId), eq(packs.authorId, authorId)))
				.limit(1)
			if (!owner) return null
			await db
				.delete(packEditingByUser)
				.where(and(eq(packEditingByUser.a, packId), eq(packEditingByUser.b, editorUserId)))
			return listEditors(db, packId)
		},

		// stats.ts
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(packs)
			return r?.count ?? 0
		},
	}
}

export function createPackElementsRepository(db: Database) {
	return {
		// get-packs.ts countOwnPackElementsById
		async countOwn(packId: number, userId: number) {
			const [r] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(packElements)
				.where(
					and(
						eq(packElements.packId, packId),
						exists(
							db
								.select({ one: sql`1` })
								.from(packs)
								.where(and(eq(packs.id, packId), ownsPack(db, userId))),
						),
					),
				)
			return r?.count ?? 0
		},

		// get-packs.ts getOwnPackElementsById (paged list with author + usage count)
		async getOwn(packId: number, userId: number, limit = 10, offset = 0) {
			return db
				.select({
					id: packElements.id,
					type: packElements.type,
					content: packElements.content,
					usedInMedia: sql<number>`(select count(*)::int from ${linkedPackElements} where ${linkedPackElements.b} = ${packElements.id})`,
					authorId: users.id,
					authorUsername: users.username,
					authorAnonymous: users.anonymous,
				})
				.from(packElements)
				.leftJoin(users, eq(users.id, packElements.authorId))
				.where(
					and(
						eq(packElements.packId, packId),
						exists(
							db
								.select({ one: sql`1` })
								.from(packs)
								.where(and(eq(packs.id, packId), ownsPack(db, userId))),
						),
					),
				)
				.limit(limit)
				.offset(offset)
		},

		// export-titles-as-txt.ts — contents of a TITLES pack the user owns
		async getOwnTitleContents(packId: number, userId: number) {
			const rows = await db
				.select({ content: packElements.content })
				.from(packElements)
				.where(
					and(
						eq(packElements.packId, packId),
						exists(
							db
								.select({ one: sql`1` })
								.from(packs)
								.where(and(eq(packs.id, packId), eq(packs.type, 'TITLES'), ownsPack(db, userId))),
						),
					),
				)
			return rows.map(r => r.content)
		},

		// browser/element.ts getOwnElementById (full detail)
		async getOwnById(id: number, userId: number) {
			const element = await db.query.packElements.findFirst({
				where: and(eq(packElements.id, id), ownsElementPack(db, userId)),
				with: {
					author: { columns: { id: true, username: true, anonymous: true } },
					pack: {
						with: {
							editors: {
								with: {
									user: {
										columns: {
											id: true,
											username: true,
											anonymous: true,
											telegramId: true,
										},
									},
								},
							},
						},
					},
				},
			})
			if (!element) return null

			const [c] = await db
				.select({
					usedInMedia: sql<number>`(select count(*)::int from ${linkedPackElements} where ${linkedPackElements.b} = ${packElements.id})`,
				})
				.from(packElements)
				.where(eq(packElements.id, id))

			const pack = element.pack
				? { ...element.pack, editors: element.pack.editors.map(e => e.user) }
				: null
			return { ...element, pack, usedInMediaCount: c?.usedInMedia ?? 0 }
		},

		// edit-element.ts — element + its pack's type, scoped to the user's packs
		async getOwnWithPackType(id: number, userId: number) {
			const [row] = await db
				.select({
					id: packElements.id,
					type: packElements.type,
					content: packElements.content,
					packId: packElements.packId,
					packType: packs.type,
				})
				.from(packElements)
				.innerJoin(packs, eq(packs.id, packElements.packId))
				.where(and(eq(packElements.id, id), ownsPack(db, userId)))
				.limit(1)
			return row ?? null
		},

		// add-element.ts / auto-uploader.ts
		async create(data: typeof packElements.$inferInsert) {
			const [el] = await db.insert(packElements).values(data).returning()
			return el!
		},

		// add-as-json.ts createMany -> inserted count
		async createMany(rows: (typeof packElements.$inferInsert)[]) {
			if (rows.length === 0) return 0
			const inserted = await db.insert(packElements).values(rows).returning({ id: packElements.id })
			return inserted.length
		},

		// edit-element.ts update (re-points authorId to the editor)
		async update(id: number, data: { content: string; authorId: number | null }) {
			const [el] = await db
				.update(packElements)
				.set(data)
				.where(eq(packElements.id, id))
				.returning()
			return el!
		},

		// browser/element.ts delete (scoped to owned packs)
		async deleteOwn(id: number, userId: number) {
			const deleted = await db
				.delete(packElements)
				.where(and(eq(packElements.id, id), ownsElementPack(db, userId)))
				.returning({ id: packElements.id })
			return deleted.length > 0
		},

		// get-random-element.ts — audit fix #3: single ORDER BY random() LIMIT 1 over the
		// filtered set, replacing the count + skip-offset + up-to-6-retries loop.
		async getRandom(types: ElementKind[], chatId?: number) {
			const scope =
				chatId != null
					? exists(
							db
								.select({ one: sql`1` })
								.from(chatEnabledPacks)
								.where(and(eq(chatEnabledPacks.b, packs.id), eq(chatEnabledPacks.a, chatId))),
						)
					: eq(packs.default, true)

			const [row] = await db
				.select(getTableColumns(packElements))
				.from(packElements)
				.innerJoin(packs, eq(packs.id, packElements.packId))
				.where(and(inArray(packElements.type, types), scope))
				.orderBy(sql`random()`)
				.limit(1)
			return row ?? null
		},

		// stats.ts
		async countAll() {
			const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(packElements)
			return r?.count ?? 0
		},
	}
}
