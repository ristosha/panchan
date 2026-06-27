import { hydrate } from '@grammyjs/hydrate'
import type { Middleware } from 'grammy'

import { i18n } from '@/bot/plugins/i18n'
import type { MyConversation, MyConversationContext } from '@/bot/types/context'
import type { Container } from '@/container'

/**
 * Plugins re-installed on the conversation's INNER context (MyConversationContext).
 * In conversations v2 the outer middleware stack is NOT replayed onto the inner
 * context, so anything the conversation reads off `ctx` (i18n `ctx.t`, hydrated
 * message helpers like `msg.delete()`, and `ctx.deps`) must be provided here.
 */
export function conversationPlugins(container: Container): Middleware<MyConversationContext>[] {
	const deps: Middleware<MyConversationContext> = async (ctx, next) => {
		ctx.deps = container
		await next()
	}
	return [
		deps,
		i18n as unknown as Middleware<MyConversationContext>,
		hydrate() as unknown as Middleware<MyConversationContext>,
	]
}

/**
 * Resolve the acting user's internal id from their Telegram id. The DB read is a
 * side-effect, so it goes through `conversation.external`; `ctx.from` itself is
 * deterministic update data and can be read directly.
 */
export async function ownUserId(
	conversation: MyConversation,
	ctx: MyConversationContext,
): Promise<number | null> {
	const tgId = ctx.from?.id
	if (tgId == null) return null
	const user = await conversation.external(() => ctx.deps.repos.users.getByTelegramId(BigInt(tgId)))
	return user?.id ?? null
}
