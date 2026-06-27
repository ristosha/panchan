import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

export const autoUploader = new Composer<MyContext>()

// Auto-ingest animations posted in the configured "media parse" group into the
// default MEDIA pack.
autoUploader
	.chatType('group')
	.on('msg:animation')
	.filter(
		ctx =>
			ctx.deps.config.BOT_MP_PARSE_CHAT_ID != null &&
			ctx.chat.id === ctx.deps.config.BOT_MP_PARSE_CHAT_ID,
	)
	.use(async ctx => {
		const fileId = ctx.msg.animation.file_id
		const pack = await ctx.deps.repos.packs.getDefaultByType('MEDIA')
		if (pack == null) {
			await ctx.reply('Default media pack is not exists')
			return
		}

		await ctx.deps.repos.packElements.create({
			type: 'ANIMATION',
			content: fileId,
			authorId: (await ctx.state.user()).id,
			packId: pack.id,
		})

		await ctx.reply('Inserted!')
	})
