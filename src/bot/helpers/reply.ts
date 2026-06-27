import type { MyContext } from '@/bot/types/context'

/**
 * Reply-to-message parameters for a send call.
 *
 * AUDIT FIX (auto-quote): the legacy `autoQuote()` middleware installed a fresh
 * `ctx.api.config.use(addReplyParameter(ctx))` transformer on the SHARED
 * `bot.api` on every single update — the transformer stack grew unboundedly
 * (the bot got slower and leaked memory the longer it ran). Instead we compute
 * the reply parameters once and pass them explicitly on the relevant send
 * calls. `allow_sending_without_reply` keeps sends working if the original
 * message was deleted meanwhile.
 */
export function quote(ctx: MyContext): {
	reply_parameters?: { message_id: number; allow_sending_without_reply: true }
} {
	const messageId = ctx.msg?.message_id
	if (messageId == null) return {}
	return { reply_parameters: { message_id: messageId, allow_sending_without_reply: true } }
}
