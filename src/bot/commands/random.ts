import { type Bot, Composer, matchFilter } from 'grammy'

import { parseArgs } from '@/bot/helpers/args'
import { extractMediaExtended } from '@/bot/helpers/extractors'
import { getRandomElement } from '@/bot/helpers/random-element'
import { rateLimit } from '@/bot/helpers/rate-limit'
import type { MyApi, MyContext } from '@/bot/types/context'

interface RandomCommandConfig {
	aliases: string[]
	/** Command the synthesised update is re-dispatched as (e.g. `dem`). */
	target: string
	/** Optional max title line count for the media branch (lobster = 1). */
	titleMaxLines?: number
}

/**
 * `/rdem` & `/rlobster` family: pick a random title (and, when no media is
 * supplied, a random media element) from the chat's enabled packs, then
 * re-dispatch the request as the real generator command, smuggling the chosen
 * element ids through the `~+*$33` marker so the result records them.
 *
 * The re-dispatch via `bot.handleUpdate(syntheticUpdate)` is ported verbatim
 * from the legacy commands (the synthetic update mutates the shared message,
 * exactly as before).
 */
export function createRandomCommand(
	bot: Bot<MyContext, MyApi>,
	cfg: RandomCommandConfig,
): Composer<MyContext> {
	const composer = new Composer<MyContext>()
	const command = composer.command(cfg.aliases)

	command.use(rateLimit)

	// with media attached → pick a title (if none given) and re-dispatch
	command
		.on(['msg:animation', 'msg:photo', 'msg:video', 'msg:sticker', 'msg:video_note'])
		.drop(matchFilter(['msg:sticker:is_animated', 'msg:sticker:premium_animation']))
		.use(async ctx => {
			const chatId = (await ctx.state.chat?.())?.id
			const match = typeof ctx.match === 'string' ? ctx.match : ''
			const parsed = parseArgs(match)

			let textContent: string | undefined = match
			const randomElements: number[] = []
			if (textContent.length === 0 || parsed._.length === 0) {
				const random = await getRandomElement(ctx.deps.repos, 'titles', chatId, cfg.titleMaxLines)
				if (random != null) randomElements.push(random.id)
				textContent = random?.content
			}

			if (textContent == null || textContent.length === 0) {
				await ctx.reply(ctx.t('command-random.no-text'))
				return
			}

			const outContent = [textContent]
			if (parsed._.length === 0) outContent.push(match)
			if (randomElements.length > 0) outContent.push(`~+*$33:${randomElements.join(':')}%`)

			const { fileId, uniqueFileId, type, isVideo } = extractMediaExtended(ctx)
			const fakeFile: Record<string, unknown> = { file_id: fileId, file_unique_id: uniqueFileId }
			if (isVideo != null) fakeFile.is_video = isVideo

			await redispatch(bot, ctx, `/${cfg.target} ${outContent.join(' ')}`, type, fakeFile)
		})

	// no media → pick a title AND a random media element, then re-dispatch
	command.on('msg', async ctx => {
		const chatId = (await ctx.state.chat?.())?.id
		const match = typeof ctx.match === 'string' ? ctx.match : ''
		const parsed = parseArgs(match)

		let textContent: string | undefined = match
		const randomElements: number[] = []
		if (textContent.length === 0 || parsed._.length === 0) {
			const random = await getRandomElement(ctx.deps.repos, 'titles', chatId)
			if (random != null) randomElements.push(random.id)
			textContent = random?.content
		}

		if (textContent == null || textContent.length === 0) {
			await ctx.reply(ctx.t('command-random.no-text'))
			return
		}

		const mediaContent = await getRandomElement(ctx.deps.repos, 'media', chatId)
		if (mediaContent == null) {
			await ctx.reply(ctx.t('command-random.no-media'))
			return
		}
		randomElements.push(mediaContent.id)

		const outContent = [textContent]
		if (parsed._.length === 0) outContent.push(match)
		if (randomElements.length > 0) outContent.push(`~+*$33:${randomElements.join(':')}%`)

		const file = await ctx.api.getFile(mediaContent.content)
		await redispatch(bot, ctx, `/${cfg.target} ${outContent.join(' ')}`, mediaContent.type, {
			file_id: file.file_id,
			file_unique_id: file.file_unique_id,
		})
	})

	return composer
}

async function redispatch(
	bot: Bot<MyContext, MyApi>,
	ctx: MyContext,
	text: string,
	type: string,
	fakeFile: Record<string, unknown>,
): Promise<void> {
	const update = Object.create(ctx.update) as Omit<typeof ctx.update, 'message'> & {
		message: Record<string, unknown>
	}
	const cmdEnd = text.indexOf(' ')
	update.message.text = text
	update.message.entities = [
		{ type: 'bot_command', offset: 0, length: cmdEnd === -1 ? text.length : cmdEnd },
	]
	if (type === 'PHOTO') update.message.photo = [fakeFile]
	else update.message[type.toLowerCase()] = fakeFile
	;(update as Record<string, unknown>).__redispatched = true

	await bot.handleUpdate(update as unknown as typeof ctx.update)
}
