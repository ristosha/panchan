import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { nanoid } from 'nanoid'

import type { ParsedArgs } from '@/bot/helpers/args'
import { parseArgsInMessage } from '@/bot/helpers/args'
import type { MyContext } from '@/bot/types/context'
import type { generatedMedia } from '@/platform/database'
import { SubprocessError, TooManyFrames } from '@/services/generation'

type MediaType = (typeof generatedMedia.$inferSelect)['type']
type MediaMime = (typeof generatedMedia.$inferSelect)['mime']

const MIME_VALUES: ReadonlySet<string> = new Set([
	'PHOTO',
	'VIDEO',
	'STICKER',
	'ANIMATION',
	'VIDEO_NOTE',
])

// Magic marker the random-* commands smuggle the chosen pack-element ids through,
// so the generated media can record which random elements produced it.
const RANDOM_MARKER = /~\+\*\$33:(\d+)(?::(\d+))?%/

export interface PreparedMedia {
	/** Local path of the downloaded source file (delete after use). */
	inputFile: string
	/** Telegram file_id of the source. */
	sourceFileId: string
	/** Public id (nanoid) baked into the output filename. */
	id: string
	/** Output filename: `<prefix><id>.<format>`. */
	fileName: string
	/** Caption text with the random marker stripped. */
	text: string
	/** Parsed + alias-mapped command options. */
	opts: ParsedArgs
	/** Pack element ids smuggled in by the random-* commands. */
	randomElements: number[]
	/** Whether to stamp the watermark (non-premium users get it). */
	watermark: boolean
}

export interface PreparedMediaWithOutput extends PreparedMedia {
	/** Temp path the generator should write its result to. */
	outputFile: string
}

function extractRandomElements(input: string): { text: string; randomElements: number[] } {
	const match = input.match(RANDOM_MARKER)
	if (match == null) return { text: input, randomElements: [] }
	const numbers: number[] = []
	if (match[1] != null) numbers.push(Number.parseInt(match[1], 10))
	if (match[2] != null) numbers.push(Number.parseInt(match[2], 10))
	return { text: input.replace(RANDOM_MARKER, ''), randomElements: numbers }
}

/** Download the source media + parse args. Mirrors legacy `prepareMedia`. */
export async function prepareMedia(
	ctx: MyContext,
	fileFormat: 'png' | 'mp4' | 'webm',
): Promise<PreparedMedia> {
	const [file, user] = await Promise.all([ctx.getFile(), ctx.state.user()])
	const inputFile = await file.download()
	const id = nanoid(12)

	const opts = parseArgsInMessage(ctx)
	let text = opts._ ?? ''
	let randomElements: number[] = []
	if (text.includes('~+*$33')) {
		;({ text, randomElements } = extractRandomElements(text))
	}

	// `-video` may arrive as the string 'true'/'' — normalise to a boolean.
	if (opts.video != null && typeof opts.video === 'string') {
		opts.video = Boolean(opts.video)
	}

	const { BOT_FILE_PREFIX } = ctx.deps.config
	return {
		inputFile,
		sourceFileId: file.file_id,
		id,
		fileName: `${BOT_FILE_PREFIX}${id}.${fileFormat}`,
		text,
		opts,
		randomElements,
		watermark: !user.premium,
	}
}

export async function prepareMediaWithOutput(
	ctx: MyContext,
	fileFormat: 'png' | 'mp4' | 'webm',
): Promise<PreparedMediaWithOutput> {
	const prepared = await prepareMedia(ctx, fileFormat)
	const outputFile = join(tmpdir(), prepared.fileName)
	return { ...prepared, outputFile }
}

export interface MediaJob {
	ctx: MyContext
	/** Temp files removed in `finally`, success or failure. */
	remove: string[]
	/** Skip the "⏳" loader (e.g. aware-scale drives its own progress message). */
	disableLoader?: boolean
	/** The heavy work; routed through the global generation queue. */
	run: () => Promise<void>
}

/**
 * Run a heavy media job: show a loader, queue it (global concurrency limit),
 * surface queue position, clean up temp files, and translate generator errors
 * into user-facing messages. Ports legacy `mediaTransaction` onto
 * `container.queue`.
 */
export async function runMediaJob(job: MediaJob): Promise<void> {
	const { ctx, remove, run, disableLoader = false } = job
	const { queue } = ctx.deps

	let loaderMsgId: number | undefined
	let loaderChatId: number | undefined
	if (!disableLoader) {
		const msg = await ctx.reply('⏳').catch(() => undefined)
		if (msg != null) {
			loaderMsgId = msg.message_id
			loaderChatId = msg.chat.id
		}
	}

	let queueMsgId: number | undefined
	let queueChatId: number | undefined

	try {
		await queue.enqueue({
			onEnqueued: async position => {
				// position === 0 means it runs immediately; only warn when waiting.
				if (position < 1) return
				const estimated = Math.ceil(queue.estimatedWaitMs / 1000)
				const msg = await ctx
					.reply(
						ctx.t('queue', {
							pos: position + 1,
							length: position + 1,
							estimated: estimated <= 0 ? '??' : estimated,
						}),
					)
					.catch(() => undefined)
				if (msg != null) {
					queueMsgId = msg.message_id
					queueChatId = msg.chat.id
				}
			},
			onStart: async () => {
				if (queueMsgId != null && queueChatId != null) {
					await ctx.api.deleteMessage(queueChatId, queueMsgId).catch(() => {})
				}
			},
			run,
		})
	} catch (error) {
		await reportMediaError(ctx, error)
	} finally {
		await Promise.all(remove.map(f => rm(f, { force: true }).catch(() => {})))
		if (loaderMsgId != null && loaderChatId != null) {
			await ctx.api.deleteMessage(loaderChatId, loaderMsgId).catch(() => {})
		}
	}
}

async function reportMediaError(ctx: MyContext, error: unknown): Promise<void> {
	if (error instanceof TooManyFrames) {
		await ctx
			.reply(ctx.t('command-aware-scale.too-many-frames', { error: String(error.frames) }))
			.catch(() => {})
		return
	}

	const message = error instanceof Error ? error.message : String(error)
	const haystack = error instanceof SubprocessError ? `${message}\n${error.stderr}` : message

	if (haystack.includes('BasicParseError')) {
		if (haystack.includes('Parse color')) {
			const invalidColor = haystack.split('Parse color')[1]?.trim().split(/\s+/)[0] ?? '?'
			await ctx.reply(`Указан несуществующий цвет: \`${invalidColor}\`!`).catch(() => {})
		} else {
			await ctx.reply(`В ваших аргументах ошибка!\n\n\`${message}\``).catch(() => {})
		}
		return
	}

	// Unknown failure — let the global bot.catch log + report it.
	throw error
}

export interface SaveMediaParams {
	ctx: MyContext
	type: MediaType
	id: string
	sourceFileId: string
	resultFileId: string
	resultFileUniqueId: string
	mime?: MediaMime
	text?: string
	meta?: Record<string, unknown>
	randomElements?: number[]
}

/** Persist a generated media row (+ link the random pack elements it used). */
export async function saveMedia(params: SaveMediaParams): Promise<void> {
	const {
		ctx,
		id,
		type,
		text,
		sourceFileId,
		resultFileId,
		resultFileUniqueId,
		randomElements,
		mime = detectMime(ctx),
	} = params

	const meta: Record<string, unknown> = { ...(params.meta ?? {}) }
	delete meta._

	const author = await ctx.state.user()
	const chat = ctx.state.chat != null ? await ctx.state.chat() : undefined

	await ctx.deps.repos.media.create(
		{
			type,
			mime,
			meta,
			publicId: id,
			sourceFileId,
			resultFileId,
			resultFileUniqueId,
			content: text ?? null,
			authorId: author.id,
			chatId: chat?.id ?? null,
		},
		randomElements != null && randomElements.length > 0 ? randomElements : [],
	)
}

/** Detect output MIME from the SOURCE message keys (legacy parity). */
export function detectMime(ctx: MyContext): MediaMime {
	const msg = ctx.msg
	if (msg != null) {
		for (const key of Object.keys(msg)) {
			const upper = key.toUpperCase()
			if (MIME_VALUES.has(upper)) return upper as MediaMime
		}
	}
	return 'PHOTO'
}

/**
 * Short-circuit duplicate requests: if we already generated this `type` from the
 * exact same `sourceFileId`, re-send the cached result instead of regenerating.
 * Returns true when a dupe was found + sent. Ports legacy `dupedRequest`.
 */
export async function sendDupe(
	ctx: MyContext,
	type: MediaType,
	send: (resultFileId: string) => Promise<unknown>,
): Promise<boolean> {
	const sourceFileId = extractSourceFileId(ctx)
	if (sourceFileId == null) return false
	const dupe = await ctx.deps.repos.media.findDupe(type, sourceFileId)
	if (dupe == null) return false
	await send(dupe.resultFileId)
	return true
}

function extractSourceFileId(ctx: MyContext): string | null {
	const msg = ctx.msg
	if (msg == null) return null
	if (msg.animation != null) return msg.animation.file_id
	if (msg.video != null) return msg.video.file_id
	if (msg.video_note != null) return msg.video_note.file_id
	if (msg.sticker != null) return msg.sticker.file_id
	if (msg.photo != null) return msg.photo.at(-1)?.file_id ?? null
	return null
}
