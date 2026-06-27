import type { MiddlewareFn } from 'grammy'

import type { MyContext } from '@/bot/types/context'

/**
 * Copy a message caption into `.text` so command/argument parsing works for
 * media sent WITH a caption (e.g. a photo captioned `/dem hello`). The
 * `non-english-commands` middleware then synthesises the `bot_command` entity.
 */
export const captionFix: MiddlewareFn<MyContext> = async (ctx, next) => {
	if (ctx.message?.caption != null && ctx.message.text == null) {
		// grammy's Message.text is a plain mutable field
		;(ctx.message as { text?: string }).text = ctx.message.caption
	}
	await next()
}
