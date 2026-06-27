import type { MyContext } from '@/bot/types/context'

type PackKind = 'TITLES' | 'MEDIA'
type PackRole = 'author' | 'editor' | null | undefined

/**
 * Transient navigation state for the pack menu tree. @grammyjs/menu only swaps the
 * inline keyboard on navigation, so (unlike grammy-inline-menu's per-template
 * `text`) we keep the "where am I / what am I looking at" context in the session
 * and rebuild message text ourselves on every transition.
 */
export interface PackMenuState {
	mode: 'own' | 'public'
	type: PackKind
	packId?: number
	role?: PackRole
	isDefault?: boolean
	packPage: number
	browserPage: number
	chatPage: number
	elementId?: number
}

function initial(): PackMenuState {
	return { mode: 'public', type: 'TITLES', packPage: 1, browserPage: 1, chatPage: 1 }
}

/**
 * Lazily-initialised, namespaced slice of `session.data`. Returns a live object —
 * mutating it mutates the session (and lazySession persists on access).
 */
export async function packState(ctx: MyContext): Promise<PackMenuState> {
	const session = await ctx.session
	let state = session.data.packMenu as PackMenuState | undefined
	if (!state) {
		state = initial()
		session.data.packMenu = state
	}
	return state
}
