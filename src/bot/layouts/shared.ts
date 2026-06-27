import { InputFile } from 'grammy'
import markdownEscape from 'markdown-escape'

import type { MyContext } from '@/bot/types/context'

import { packState } from './state'

type EditTextExtra = Parameters<MyContext['editMessageText']>[1]

const MD: EditTextExtra = { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }

export const PACKS_PER_PAGE = 7
export const ELEMENTS_PER_PAGE = 8
export const CHATS_PER_PAGE = 8

/**
 * editMessageText that swallows the "message is not modified" / edit-race errors
 * that Telegram throws when a transition lands on identical content. The menu
 * plugin re-renders the active menu's keyboard onto this edit automatically.
 */
export async function safeEditText(
	ctx: MyContext,
	text: string,
	extra: EditTextExtra = MD,
): Promise<void> {
	try {
		await ctx.editMessageText(text, extra)
	} catch {
		// not-modified or the message was deleted — nothing actionable
	}
}

export function packListText(ctx: MyContext, type: 'TITLES' | 'MEDIA'): string {
	return ctx.t('menu-pack-list', { type: type.toLowerCase() })
}

/**
 * Load a pack, record role/type/default in session, and render its detail text.
 * Used both when drilling into a pack and when navigating back to it.
 */
export async function openPack(ctx: MyContext, packId: number): Promise<void> {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id

	const data =
		state.mode === 'own'
			? await ctx.deps.repos.packs.getOwnPackById(packId, userId)
			: await ctx.deps.repos.packs.getPublicPackById(packId)

	if (data === null) {
		state.role = undefined
		await safeEditText(ctx, ctx.t('menu-pack.not-found'), { parse_mode: 'Markdown' })
		return
	}

	state.packId = data.id
	state.type = data.type
	state.isDefault = data.default
	state.role =
		data.authorId === userId ? 'author' : data.editors.some(e => e.id === userId) ? 'editor' : null

	const author =
		data.author?.anonymous === true || data.author?.username == null
			? ctx.t('anonymous-author')
			: data.author.username

	const text = ctx.t('menu-pack', {
		id: data.id,
		name: markdownEscape(data.name),
		type: data.type.toLowerCase(),
		private: String(data.private),
		elementCount: data.elementsCount,
		chatCount: data.usedInChatsCount,
		nsfw: String((data.tags ?? []).includes('nsfw')),
		default: String(data.default),
		description:
			data.description == null ? ctx.t('no-description') : markdownEscape(data.description),
		author,
	})

	await safeEditText(ctx, text)
}

/** Render the current page of the element browser. */
export async function openBrowser(ctx: MyContext): Promise<void> {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id
	const packId = state.packId ?? -1

	const count = await ctx.deps.repos.packElements.countOwn(packId, userId)
	const totalPages = Math.ceil(count / ELEMENTS_PER_PAGE)

	if (totalPages === 0) {
		state.browserPage = 1
		await safeEditText(ctx, ctx.t('menu-element-browser.empty', { packId }), {
			parse_mode: 'Markdown',
		})
		return
	}

	if (state.browserPage > totalPages) state.browserPage = 1
	if (state.browserPage < 1) state.browserPage = 1
	const page = state.browserPage

	const elements = await ctx.deps.repos.packElements.getOwn(
		packId,
		userId,
		ELEMENTS_PER_PAGE,
		(page - 1) * ELEMENTS_PER_PAGE,
	)

	const list = elements
		.map(e =>
			ctx.t('menu-element-browser.element', {
				id: e.id,
				content: e.content.split('\n').join(' \\ '),
			}),
		)
		.join('\n')

	await safeEditText(
		ctx,
		ctx.t('menu-element-browser', { page, totalPages, packId, elements: list }),
	)
}

/**
 * Render a single element's detail. For media elements the message text can't hold
 * the media (Telegram won't convert a text message into a photo/video), so we send
 * the media as a separate preview message — a deliberate deviation from the legacy
 * inline-menu which rendered media inline.
 */
export async function openElement(ctx: MyContext, id: number): Promise<void> {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id

	const element = await ctx.deps.repos.packElements.getOwnById(id, userId)
	state.elementId = element?.id

	if (!element) {
		await safeEditText(ctx, ctx.t('menu-element.empty'), { parse_mode: 'Markdown' })
		return
	}

	const text = ctx.t('menu-element', {
		id: element.id,
		type: element.type,
		content: element.content.replaceAll('`', '\\`'),
		author: element.author?.username ?? ctx.t('anonymous-author'),
	})

	await safeEditText(ctx, text)

	if (element.type !== 'TEXT') {
		await sendMediaPreview(ctx, element.type, element.content)
	}
}

async function sendMediaPreview(ctx: MyContext, type: string, fileId: string): Promise<void> {
	try {
		switch (type) {
			case 'PHOTO':
				await ctx.replyWithPhoto(fileId)
				break
			case 'VIDEO':
				await ctx.replyWithVideo(fileId)
				break
			case 'ANIMATION':
				await ctx.replyWithAnimation(fileId)
				break
			case 'STICKER':
				await ctx.replyWithSticker(fileId)
				break
		}
	} catch {
		// preview is best-effort
	}
}

/**
 * Export action for the pack menu: dump a TITLES pack's contents as a .txt file.
 * Returns true when a document was sent (so the caller can close the menu).
 */
export async function exportTitles(ctx: MyContext): Promise<boolean> {
	const state = await packState(ctx)
	const userId = (await ctx.state.user()).id
	const packId = state.packId ?? -1

	const contents = await ctx.deps.repos.packElements.getOwnTitleContents(packId, userId)
	if (contents.length === 0) {
		await ctx.answerCallbackQuery({ text: ctx.t('conv-export-pack.empty') }).catch(() => {})
		return false
	}

	const body = contents.map(c => c.replaceAll('\n', '\\')).join('\n')
	await ctx.answerCallbackQuery().catch(() => {})
	await ctx.replyWithDocument(new InputFile(Buffer.from(body), `pack-${packId}-export.txt`))
	return true
}
