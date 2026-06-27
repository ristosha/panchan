import { lazySession } from 'grammy'

import { createSessionStorage } from '@/bot/core/session-storage'
import type { MyContext, SessionData } from '@/bot/types/context'
import type { Container } from '@/container'

/**
 * Persist a session row ONLY for interactions that actually need stored state:
 * private chats, callback queries (menus), and inline interactions. Plain group
 * messages from lurkers get no row — this is what kills the 45k-row bloat (45704
 * sessions for 3196 users). Combined with lazySession, a row is also only
 * WRITTEN when the session is actually mutated.
 */
function getSessionKey(ctx: Omit<MyContext, 'session'>): string | undefined {
	if (ctx.from === undefined) return undefined
	if (ctx.callbackQuery !== undefined) return String(ctx.from.id)
	if (ctx.inlineQuery !== undefined) return String(ctx.from.id)
	if (ctx.chat?.type === 'private') return String(ctx.from.id)
	return undefined
}

export function createSessionPlugin(container: Container) {
	return lazySession<SessionData, MyContext>({
		initial: (): SessionData => ({ data: {} }),
		storage: createSessionStorage<SessionData>(container.db),
		getSessionKey,
	})
}
