import { Composer, InputFile, matchFilter } from 'grammy'

import { sendTypingAction } from '@/bot/helpers/chat-action'
import { getAnimationOrVideoId } from '@/bot/helpers/extractors'
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

export const boom = new Composer<MyContext>()
const command = boom.command(['boom', 'бум', 'взрыв'])

command.use(rateLimit)

// video / animation / video sticker / video note → boom video
command
	.on(['msg:video', 'msg:animation', 'msg:sticker:is_video', 'msg:video_note'])
	.use(sendTypingAction)
	.use(async ctx => {
		const handled = await sendDupe(ctx, 'BOOM', resultFileId =>
			ctx.replyWithAnimation(resultFileId, quote(ctx)),
		)
		if (handled) return

		const { inputFile, outputFile, id, sourceFileId, fileName, watermark } =
			await prepareMediaWithOutput(ctx, 'mp4')

		await runMediaJob({
			ctx,
			remove: [inputFile, outputFile],
			run: async () => {
				await ctx.deps.gen.boomVideo({ inputFile, outputFile, watermark })
				const sent = await ctx.replyWithAnimation(new InputFile(outputFile, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent)
				await saveMedia({ ctx, id, sourceFileId, resultFileId, resultFileUniqueId, type: 'BOOM' })
			},
		})
	})

// photo / static sticker → boom image (still looped then the boom clip)
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
		const { inputFile, outputFile, id, sourceFileId, fileName, watermark } =
			await prepareMediaWithOutput(ctx, 'mp4')

		await runMediaJob({
			ctx,
			remove: [inputFile, outputFile],
			run: async () => {
				await ctx.deps.gen.boomImage({ inputFile, outputFile, watermark })
				const sent = await ctx.replyWithAnimation(new InputFile(outputFile, fileName), quote(ctx))
				const { resultFileId, resultFileUniqueId } = getAnimationOrVideoId(sent)
				await saveMedia({ ctx, id, sourceFileId, resultFileId, resultFileUniqueId, type: 'BOOM' })
			},
		})
	})

command.use(noMediaError(['photo', 'video', 'animation', 'photo-sticker', 'video-sticker']))
