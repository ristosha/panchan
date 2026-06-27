import type { MiddlewareFn } from 'grammy'

import type { MyContext } from '@/bot/types/context'

/**
 * Fire a `choose_sticker` chat action then continue. Ports the legacy `type`
 * middleware used ahead of each generator branch.
 *
 * AUDIT NOTE: the legacy `auto-chat-action` middleware installed a per-update
 * `ctx.api.config.use(...)` transformer on the shared `bot.api` (the same
 * unbounded-stack leak as `auto-quote`) — and it was disabled in the legacy
 * composition anyway. We instead emit the action explicitly where it matters.
 */
export const sendTypingAction: MiddlewareFn<MyContext> = async (ctx, next) => {
	void ctx.replyWithChatAction('choose_sticker').catch(() => {})
	await next()
}
