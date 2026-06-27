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

export const text = new Composer<MyContext>()
const command = text.command(['text', 'lobster', 'лобстер', 'текст'])

command.use(rateLimit)

// video / animation / video sticker
command
	.on(['msg:animation', 'msg:video', 'msg:sticker:is_video'])
	.use(sendTypingAction)
	.use(async ctx => {
		const meta = ctx.msg.video
		const {
			inputFile,
			outputFile,
			text: caption,
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
				await ctx.deps.gen.createTextVideo({
					inputFile,
					outputFile,
					text: caption,
					meta,
					opts,
					watermark,
				})
				const sent = await ctx.replyWithAnimation(new InputFile(outputFile, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent)

				await saveMedia({
					ctx,
					id,
					sourceFileId,
					resultFileId,
					resultFileUniqueId,
					text: caption,
					randomElements,
					meta: opts,
					type: 'TEXT',
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
		const {
			inputFile,
			text: caption,
			id,
			sourceFileId,
			fileName,
			opts,
			watermark,
			randomElements,
		} = await prepareMedia(ctx, 'png')

		await runMediaJob({
			ctx,
			remove: [inputFile],
			run: async () => {
				const buffer = await ctx.deps.gen.createTextImage({
					inputFile,
					text: caption,
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
					text: caption,
					randomElements,
					meta: opts,
					type: 'TEXT',
				})
			},
		})
	})

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
