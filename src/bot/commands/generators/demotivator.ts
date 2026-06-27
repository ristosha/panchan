import { Composer, InputFile, matchFilter } from 'grammy'

import { sendTypingAction } from '@/bot/helpers/chat-action'
import { getAnimationOrVideoId, getPhotoId } from '@/bot/helpers/extractors'
import {
	prepareMedia,
	prepareMediaWithOutput,
	runMediaJob,
	saveMedia,
} from '@/bot/helpers/media-pipeline'
import { noMediaError } from '@/bot/helpers/no-media-error'
import { rateLimit } from '@/bot/helpers/rate-limit'
import { quote } from '@/bot/helpers/reply'
import type { MyContext } from '@/bot/types/context'

export const demotivator = new Composer<MyContext>()
const command = demotivator.command(['demotivator', 'dem', 'demik'])

command.use(rateLimit)

// video / animation / video sticker / video note
command
	.on(['msg:video', 'msg:animation', 'msg:sticker:is_video', 'msg:video_note'])
	.use(sendTypingAction)
	.use(async ctx => {
		const duration = ctx.msg.video?.duration ?? ctx.msg.video_note?.duration
		const circle = ctx.msg.video_note != null

		const {
			inputFile,
			outputFile,
			text,
			id,
			sourceFileId,
			fileName,
			opts,
			watermark,
			randomElements,
		} = await prepareMediaWithOutput(ctx, 'mp4')

		await runMediaJob({
			ctx,
			remove: [inputFile, outputFile],
			run: async () => {
				await ctx.deps.gen.createDemotivatorVideo({
					inputFile,
					outputFile,
					text,
					duration,
					opts,
					circle,
					watermark,
				})
				const result = new InputFile(outputFile, fileName)
				const sent =
					opts.video === true
						? await ctx.replyWithVideo(result, quote(ctx))
						: await ctx.replyWithAnimation(result, quote(ctx))
				const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent)

				await saveMedia({
					ctx,
					id,
					sourceFileId,
					resultFileId,
					resultFileUniqueId,
					text,
					randomElements,
					meta: opts,
					type: 'DEMOTIVATOR',
				})
			},
		})
	})

// photo / static sticker
command
	.on(['msg:photo', 'msg:sticker'])
	.drop(
		matchFilter([
			'msg:sticker:is_animated',
			'msg:sticker:is_video',
			'msg:sticker:premium_animation',
		]),
	)
	.use(sendTypingAction)
	.use(async ctx => {
		const { inputFile, text, id, sourceFileId, fileName, opts, watermark, randomElements } =
			await prepareMedia(ctx, 'png')

		await runMediaJob({
			ctx,
			remove: [inputFile],
			run: async () => {
				const buffer = await ctx.deps.gen.createDemotivatorImage({
					inputFile,
					text,
					opts,
					watermark,
				})
				const sent = await ctx.replyWithPhoto(new InputFile(buffer, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getPhotoId(sent)

				await saveMedia({
					ctx,
					id,
					sourceFileId,
					resultFileId,
					resultFileUniqueId,
					text,
					randomElements,
					meta: opts,
					type: 'DEMOTIVATOR',
				})
			},
		})
	})

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
