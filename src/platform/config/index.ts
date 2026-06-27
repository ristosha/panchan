import { z } from 'zod'

import { LOG_FORMATS, LOG_LEVELS } from '@/platform/logger'

const csvIds = z
	.string()
	.default('')
	.transform(s =>
		s
			.split(',')
			.map(v => v.trim())
			.filter(Boolean),
	)

const schema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
	LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
	LOG_FORMAT: z.enum(LOG_FORMATS).default('json'),

	DATABASE_URL: z.string().min(1),
	DB_MAX_CONNECTIONS: z.coerce.number().int().default(8),

	BOT_TOKEN: z.string().min(1),
	BOT_ADMIN_ID: z.coerce.number().nullable().default(null),
	BOT_LOG_CHAT_ID: z.coerce.number().nullable().default(null),
	BOT_MP_PARSE_CHAT_ID: z.coerce.number().nullable().default(null),
	BOT_FILE_PREFIX: z.string().default('ppb-'),
	BOT_GUIDE_URL: z.string().default('https://telegra.ph/'),

	// bots allowed to use the bot (besides humans)
	ALLOWED_BOT_IDS: csvIds,

	// ── media generation tuning (2-core / 3.8GB + swap) ──
	// global cap on concurrent CPU-heavy generation jobs across ALL queues
	GEN_CONCURRENCY: z.coerce.number().int().default(1),
	// ffmpeg encode/decode threads
	MEDIA_THREADS: z.coerce.number().int().default(2),
	// concurrent ImageMagick seam-carve processes per aware-scale video chunk
	// (legacy read the wrong key `AWAIT_SCALE_CHUNK` and was stuck at 5)
	AWARE_SCALE_CHUNK: z.coerce.number().int().default(2),
	AWARE_SCALE_FRAMES_LIMIT: z.coerce.number().int().default(150),

	// executables
	FFMPEG: z.string().default('ffmpeg'),
	FFPROBE: z.string().default('ffprobe'),
	IMAGE_MAGICK: z.string().default('magick'),

	// retention (prune script)
	SESSION_TTL_DAYS: z.coerce.number().int().default(30),
	// effectively "keep all" — usage rows are tiny (~3MB/yr) and power /stats
	// analytics, so don't prune them by default; sessions are the real bloat.
	USES_TTL_DAYS: z.coerce.number().int().default(3650),
})

export type Config = z.infer<typeof schema> & {
	isDev(): boolean
	isProd(): boolean
	isAdmin(telegramId: number | bigint): boolean
	isAllowedBot(botId: number | bigint): boolean
}

export function createConfig(env: Record<string, string | undefined>): Config {
	const parsed = schema.parse(env)
	return {
		...parsed,
		isDev: () => parsed.NODE_ENV === 'development',
		isProd: () => parsed.NODE_ENV === 'production',
		isAdmin: telegramId =>
			parsed.BOT_ADMIN_ID != null && Number(telegramId) === parsed.BOT_ADMIN_ID,
		isAllowedBot: botId => parsed.ALLOWED_BOT_IDS.includes(String(botId)),
	}
}
