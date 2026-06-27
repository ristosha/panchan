import { sql } from 'drizzle-orm'
import {
	bigint,
	boolean,
	customType,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core'

// drizzle's built-in jsonb() JSON.stringify's the value, but the bun-sql driver
// ALSO encodes objects to jsonb — that double-encode stored everything as a jsonb
// *string*. This passthrough leaves the single, correct encode to bun-sql.
const jsonb = customType<{ data: unknown }>({
	dataType: () => 'jsonb',
	toDriver: value => value,
	fromDriver: value => (typeof value === 'string' ? JSON.parse(value) : value),
})

// ───────────────────────────── enums ─────────────────────────────

export const userRole = pgEnum('user_role', ['USER', 'MODERATOR', 'ADMIN'])
export const chatMemberRole = pgEnum('chat_member_role', ['MEMBER', 'ADMIN', 'CREATOR'])
export const generatedMediaType = pgEnum('generated_media_type', [
	'TEXT',
	'BOOM',
	'BALLOON',
	'STRETCH',
	'FISHEYE',
	'DEMOTIVATOR',
	'AWARE_SCALE',
])
export const mediaMime = pgEnum('media_mime', [
	'PHOTO',
	'VIDEO',
	'STICKER',
	'ANIMATION',
	'VIDEO_NOTE',
])
export const packType = pgEnum('pack_type', ['TITLES', 'MEDIA'])
export const packElementType = pgEnum('pack_element_type', [
	'TEXT',
	'PHOTO',
	'VIDEO',
	'STICKER',
	'ANIMATION',
])

// Column names are written EXPLICITLY (matching the legacy Prisma DB exactly,
// including quoted camelCase columns) so that a `pg_dump --data-only` COPY from
// the old database loads 1:1 into this freshly-created schema.

// ───────────────────────────── users ─────────────────────────────

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull(),
		username: varchar('username', { length: 32 }),
		premium: boolean('premium').default(false).notNull(),
		role: userRole('role').default('USER').notNull(),
		anonymous: boolean('anonymous').default(false).notNull(),
		searchIncluded: boolean('searchIncluded').default(true).notNull(),
		lastGroupContactedAt: timestamp('lastGroupContactedAt', { mode: 'date' }),
		lastPrivateContactedAt: timestamp('lastPrivateContactedAt', { mode: 'date' }),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
	},
	t => [uniqueIndex('users_telegram_id_key').on(t.telegramId)],
)

// ───────────────────────────── chats ─────────────────────────────

export const chats = pgTable(
	'chats',
	{
		id: serial('id').primaryKey(),
		telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull(),
		title: varchar('title', { length: 256 }),
		memberCount: integer('member_count').default(0).notNull(),
		disabledCommands: varchar('disabled_commands', { length: 32 }).array(),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
	},
	t => [uniqueIndex('chats_telegram_id_key').on(t.telegramId)],
)

// ───────────────────────────── chat_members ─────────────────────────────

export const chatMembers = pgTable(
	'chat_members',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		chatId: integer('chat_id')
			.notNull()
			.references(() => chats.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		role: chatMemberRole('role').default('MEMBER').notNull(),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
	},
	t => [
		uniqueIndex('chat_members_user_id_chat_id_key').on(t.userId, t.chatId),
		index('chat_members_chat_id_idx').on(t.chatId),
	],
)

// ───────────────────────────── channel ─────────────────────────────

export const channel = pgTable(
	'channel',
	{
		id: serial('id').primaryKey(),
		telegramId: bigint('telegram_id', { mode: 'bigint' }).notNull(),
		creatorTelegramId: bigint('creatorTelegramId', { mode: 'bigint' }),
		adminsTelegramIds: bigint('adminsTelegramIds', { mode: 'bigint' }).array().default([]),
		title: text('title'),
		memberCount: integer('member_count').default(0).notNull(),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow().notNull(),
	},
	t => [uniqueIndex('channel_telegram_id_key').on(t.telegramId)],
)

// ───────────────────────────── packs ─────────────────────────────

export const packs = pgTable(
	'packs',
	{
		id: serial('id').primaryKey(),
		type: packType('type').notNull(),
		name: varchar('name', { length: 32 }).notNull(),
		description: varchar('description', { length: 300 }),
		tags: varchar('tags', { length: 10 }).array(),
		bannerFileId: varchar('banner_file_id', { length: 300 }),
		default: boolean('default').default(false).notNull(),
		private: boolean('private').default(true).notNull(),
		everyoneCanInsert: boolean('everyone_can_insert').default(false).notNull(),
		showAuthor: boolean('show_author').default(true).notNull(),
		authorId: integer('author_id').references(() => users.id, {
			onUpdate: 'cascade',
			onDelete: 'set null',
		}),
	},
	t => [index('packs_type_idx').on(t.type), index('packs_author_id_idx').on(t.authorId)],
)

// ───────────────────────────── pack_elements ─────────────────────────────

export const packElements = pgTable(
	'pack_elements',
	{
		id: serial('id').primaryKey(),
		type: packElementType('type').notNull(),
		content: varchar('content', { length: 300 }).notNull(),
		packId: integer('pack_id')
			.notNull()
			.references(() => packs.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		authorId: integer('author_id').references(() => users.id, {
			onUpdate: 'cascade',
			onDelete: 'set null',
		}),
	},
	t => [
		index('pack_elements_pack_id_idx').on(t.packId),
		index('pack_elements_author_id_idx').on(t.authorId),
	],
)

// ───────────────────────────── generated_media ─────────────────────────────

export const generatedMedia = pgTable(
	'generated_media',
	{
		id: serial('id').primaryKey(),
		publicId: varchar('publicId', { length: 24 }).notNull(),
		type: generatedMediaType('type').notNull(),
		mime: mediaMime('mime').notNull(),
		sourceFileId: varchar('source_file_id', { length: 300 }).notNull(),
		resultFileId: varchar('result_file_id', { length: 300 }).notNull(),
		resultFileUniqueId: varchar('result_file_unique_id', { length: 300 }).notNull(),
		content: varchar('content', { length: 2048 }),
		authorId: integer('author_id').references(() => users.id, {
			onUpdate: 'cascade',
			onDelete: 'set null',
		}),
		chatId: integer('chat_id').references(() => chats.id, {
			onUpdate: 'cascade',
			onDelete: 'set null',
		}),
		// was `json` in the legacy schema — upgraded to jsonb (indexable, no reparse)
		meta: jsonb('meta').default({}).notNull(),
		// was `date` in the legacy schema — upgraded to timestamptz (keeps time-of-day)
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
	},
	t => [
		uniqueIndex('generated_media_publicId_key').on(t.publicId),
		index('idx_generated_media_source_file_id').on(t.sourceFileId),
		index('idx_generated_media_result_file_id').on(t.resultFileId),
		// hot path: handle-usage looks this up on EVERY media message (was a seq scan)
		index('idx_generated_media_result_file_unique_id').on(t.resultFileUniqueId),
		index('generated_media_type_idx').on(t.type),
		index('generated_media_author_id_idx').on(t.authorId),
		index('generated_media_chat_id_idx').on(t.chatId),
		// full-text search over content (russian) — replaces seq-scan to_tsvector
		index('generated_media_content_fts_idx').using(
			'gin',
			sql`to_tsvector('russian', coalesce(${t.content}, ''))`,
		),
	],
)

// ───────────────────────────── generated_media_uses ─────────────────────────────

export const generatedMediaUses = pgTable(
	'generated_media_uses',
	{
		id: serial('id').primaryKey(),
		generatedMediaId: integer('generated_media_id')
			.notNull()
			.references(() => generatedMedia.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		chatId: integer('chat_id').references(() => chats.id, {
			onUpdate: 'cascade',
			onDelete: 'set null',
		}),
		usedByTelegramId: bigint('used_by_telegram_id', { mode: 'bigint' }).notNull(),
		createdAt: timestamp('createdAt', { precision: 3, mode: 'date' }).defaultNow().notNull(),
	},
	t => [
		index('generated_media_uses_generated_media_id_idx').on(t.generatedMediaId),
		index('generated_media_uses_used_by_telegram_id_idx').on(t.usedByTelegramId),
		index('generated_media_uses_chat_id_idx').on(t.chatId),
		index('generated_media_uses_created_at_idx').on(t.createdAt),
	],
)

// ───────────────────────────── user_commands_preferences ─────────────────────────────

export const userCommandsPreferences = pgTable('user_commands_preferences', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	name: varchar('name', { length: 32 }).notNull(),
	preferences: jsonb('preferences').default({}).notNull(),
	updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
})

// ───────────────────────────── sessions (grammy storage) ─────────────────────────────

export const sessions = pgTable(
	'sessions',
	{
		key: text('key').primaryKey(),
		value: text('value').notNull(),
		// new column — enables TTL pruning of abandoned sessions (the 45k-row bloat)
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	t => [index('sessions_updated_at_idx').on(t.updatedAt)],
)

// ───────────────────────── implicit M2M join tables ─────────────────────────
// Legacy Prisma implicit relations. Kept with their exact "A"/"B" column names
// so the data dump loads unchanged; queried explicitly in repositories.

// chats (A) <-> packs (B)
export const chatEnabledPacks = pgTable(
	'_chat_enabled_packs',
	{
		a: integer('A')
			.notNull()
			.references(() => chats.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		b: integer('B')
			.notNull()
			.references(() => packs.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	},
	t => [
		uniqueIndex('_chat_enabled_packs_AB_unique').on(t.a, t.b),
		index('_chat_enabled_packs_B_index').on(t.b),
	],
)

// generated_media (A) <-> pack_elements (B)
export const linkedPackElements = pgTable(
	'_linked_pack_elements',
	{
		a: integer('A')
			.notNull()
			.references(() => generatedMedia.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		b: integer('B')
			.notNull()
			.references(() => packElements.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	},
	t => [
		uniqueIndex('_linked_pack_elements_AB_unique').on(t.a, t.b),
		index('_linked_pack_elements_B_index').on(t.b),
	],
)

// packs (A) <-> users (B)  (editors)
export const packEditingByUser = pgTable(
	'_pack_editing_by_user',
	{
		a: integer('A')
			.notNull()
			.references(() => packs.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
		b: integer('B')
			.notNull()
			.references(() => users.id, { onUpdate: 'cascade', onDelete: 'cascade' }),
	},
	t => [
		uniqueIndex('_pack_editing_by_user_AB_unique').on(t.a, t.b),
		index('_pack_editing_by_user_B_index').on(t.b),
	],
)
