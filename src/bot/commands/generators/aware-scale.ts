import { Composer, InputFile, matchFilter } from 'grammy'

import { resizeComposite } from '@/bot/helpers/args'
import { sendTypingAction } from '@/bot/helpers/chat-action'
import { getAnimationOrVideoId, getPhotoId } from '@/bot/helpers/extractors'
import {
	prepareMediaWithOutput,
	runMediaJob,
	saveMedia,
	sendDupe,
} from '@/bot/helpers/media-pipeline'
import { noMediaError } from '@/bot/helpers/no-media-error'
import { awareScaleRateLimit } from '@/bot/helpers/rate-limit'
import { quote } from '@/bot/helpers/reply'
import type { MyContext } from '@/bot/types/context'
import { createLoader } from '@/services/generation'

export const awareScale = new Composer<MyContext>()
const command = awareScale.command(['aware-scale', 'ascale', 'scale', 'жмых'])

command.use(awareScaleRateLimit)

// video / animation / video sticker / video note
command
	.on(['msg:video', 'msg:animation', 'msg:sticker:is_video', 'msg:video_note'])
	.use(sendTypingAction)
	.use(async ctx => {
		const handled = await sendDupe(ctx, 'AWARE_SCALE', resultFileId =>
			ctx.replyWithAnimation(resultFileId, quote(ctx)),
		)
		if (handled) return

		const { inputFile, outputFile, id, sourceFileId, fileName, watermark } =
			await prepareMediaWithOutput(ctx, 'mp4')

		const loader = createLoader()
		const msg = await ctx.reply(ctx.t('command-aware-scale.prepare'))
		// edit the progress message every 10% of progress
		loader.subscribe(async (step, progress, remaining) => {
			await ctx.api
				.editMessageText(
					msg.chat.id,
					msg.message_id,
					ctx.t(`command-aware-scale.${step}`, { progress, remaining }),
				)
				.catch(() => {})
		}, 10)

		await runMediaJob({
			ctx,
			disableLoader: true,
			remove: [inputFile, outputFile],
			run: async () => {
				await ctx.deps.gen.awareScaleVideo({ inputFile, outputFile, loader, watermark })
				const sent = await ctx.replyWithAnimation(new InputFile(outputFile, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent)
				await saveMedia({
					ctx,
					id,
					sourceFileId,
					resultFileId,
					resultFileUniqueId,
					type: 'AWARE_SCALE',
				})
			},
		})

		await ctx.api.deleteMessage(msg.chat.id, msg.message_id).catch(() => {})
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
		const { inputFile, outputFile, id, sourceFileId, fileName, opts, watermark } =
			await prepareMediaWithOutput(ctx, 'png')

		const args = resizeComposite.build(opts) as {
			scale?: { width: number; height: number }
			resize?: { width: number; height: number }
		}

		await runMediaJob({
			ctx,
			disableLoader: true,
			remove: [inputFile, outputFile],
			run: async () => {
				await ctx.deps.gen.awareScaleImage({
					inputFile,
					outputFile,
					watermark,
					scale: args.scale,
					resize: args.resize,
				})
				const sent = await ctx.replyWithPhoto(new InputFile(outputFile, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getPhotoId(sent)
				await saveMedia({
					ctx,
					id,
					sourceFileId,
					resultFileId,
					resultFileUniqueId,
					meta: opts,
					type: 'AWARE_SCALE',
				})
			},
		})
	})

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
