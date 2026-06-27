import { Composer, InputFile, matchFilter } from 'grammy'

import { sendTypingAction } from '@/bot/helpers/chat-action'
import { getAnimationOrVideoId, getPhotoId } from '@/bot/helpers/extractors'
import {
	prepareMediaWithOutput,
	runMediaJob,
	saveMedia,
	sendDupe,
} from '@/bot/helpers/media-pipeline'
import { noMediaError } from '@/bot/helpers/no-media-error'
import { rateLimit } from '@/bot/helpers/rate-limit'
import { quote } from '@/bot/helpers/reply'
import type { MyContext } from '@/bot/types/context'
import type { generatedMedia } from '@/platform/database'

type MediaType = (typeof generatedMedia.$inferSelect)['type']

interface SphericalParams {
	inputFile: string
	outputFile: string
	watermark?: boolean
}

export interface SphericalCommandConfig {
	aliases: string[]
	type: MediaType
	/** How the video result is sent back (balloon = round video note). */
	videoKind: 'animation' | 'video_note'
	image: (ctx: MyContext, params: SphericalParams) => Promise<void>
	video: (ctx: MyContext, params: SphericalParams) => Promise<void>
}

/**
 * Shared command shape for the equirectangular projection generators
 * (balloon / fisheye / stretch): rate limit → video branch (with dedup) →
 * photo branch → no-media fallback.
 */
export function createSphericalCommand(cfg: SphericalCommandConfig): Composer<MyContext> {
	const composer = new Composer<MyContext>()
	const command = composer.command(cfg.aliases)

	command.use(rateLimit)

	// video / animation / video sticker / video note
	command
		.on(['msg:video', 'msg:animation', 'msg:sticker:is_video', 'msg:video_note'])
		.use(sendTypingAction)
		.use(async ctx => {
			// dedup: re-send the cached result if we already made this exact transform
			const handled = await sendDupe(ctx, cfg.type, async resultFileId =>
				cfg.videoKind === 'video_note'
					? ctx.replyWithVideoNote(resultFileId, quote(ctx))
					: ctx.replyWithAnimation(resultFileId, quote(ctx)),
			)
			if (handled) return

			const { inputFile, outputFile, id, sourceFileId, fileName, watermark } =
				await prepareMediaWithOutput(ctx, 'mp4')

			await runMediaJob({
				ctx,
				remove: [inputFile, outputFile],
				run: async () => {
					await cfg.video(ctx, { inputFile, outputFile, watermark })
					const result = new InputFile(outputFile, fileName)

					let resultFileId: string
					let resultFileUniqueId: string
					if (cfg.videoKind === 'video_note') {
						const sent = await ctx.replyWithVideoNote(result, quote(ctx))
						resultFileId = sent.video_note.file_id
						resultFileUniqueId = sent.video_note.file_unique_id
					} else {
						const sent = await ctx.replyWithAnimation(result, quote(ctx))
						;({ resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent))
					}

					await saveMedia({
						ctx,
						id,
						sourceFileId,
						resultFileId,
						resultFileUniqueId,
						type: cfg.type,
					})
				},
			})
		})

	// photo / static sticker
	command
		.on(['msg:photo', 'msg:sticker'])
		.drop(
			matchFilter([
				'msg:sticker:is_video',
				'msg:sticker:is_animated',
				'msg:sticker:premium_animation',
			]),
		)
		.use(sendTypingAction)
		.use(async ctx => {
			const { inputFile, outputFile, id, sourceFileId, fileName, watermark } =
				await prepareMediaWithOutput(ctx, 'png')

			await runMediaJob({
				ctx,
				remove: [inputFile, outputFile],
				run: async () => {
					await cfg.image(ctx, { inputFile, outputFile, watermark })
					const sent = await ctx.replyWithPhoto(new InputFile(outputFile, fileName), quote(ctx))
					const { resultFileId, resultFileUniqueId } = getPhotoId(sent)
					await saveMedia({
						ctx,
						id,
						sourceFileId,
						resultFileId,
						resultFileUniqueId,
						type: cfg.type,
					})
				},
			})
		})

	command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))

	return composer
}
