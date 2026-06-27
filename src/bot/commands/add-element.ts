import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { extractId, extractMedia, type PackElementKind } from './pack-extractors'

const MEDIA_KINDS: PackElementKind[] = ['VIDEO', 'ANIMATION', 'PHOTO']

/** `/add <packId> <content|media>` — append an element to a pack you own/edit. */
export const addElement = new Composer<MyContext>()
const add = addElement.command('add')

add.on(['msg:animation', 'msg:video', 'msg:photo'], async ctx => {
	const { id: packId } = extractId(ctx)
	if (Number.isNaN(packId)) {
		await ctx.reply(ctx.t('command-add.no-id'))
		return
	}

	const { fileId, type } = extractMedia(ctx)
	if (fileId == null) {
		await ctx.reply(ctx.t('command-add.incompatible-types'))
		return
	}

	const result = await addPackElement(ctx, packId, type, fileId)
	if (result != null) {
		await ctx.reply(ctx.t(`command-add.${result}`))
		return
	}
	await ctx.reply(ctx.t('command-add.ok', { packId }))
})

add.on('msg', async ctx => {
	const { id: packId, content } = extractId(ctx)
	if (Number.isNaN(packId)) {
		await ctx.reply(ctx.t('command-add.no-id'))
		return
	}
	if (content.length === 0) {
		await ctx.reply(ctx.t('command-add.empty'))
		return
	}

	const result = await addPackElement(ctx, packId, 'TEXT', content)
	if (result != null) {
		await ctx.reply(ctx.t(`command-add.${result}`))
		return
	}
	await ctx.reply(ctx.t('command-add.ok', { packId }))
})

async function addPackElement(
	ctx: MyContext,
	packId: number,
	type: PackElementKind,
	content: string,
): Promise<'not-found' | 'incompatible-types' | null> {
	const userId = (await ctx.state.user()).id
	const pack = await ctx.deps.repos.packs.findOwnPack(packId, userId)
	if (pack == null) return 'not-found'

	if (pack.type === 'TITLES' && type !== 'TEXT') return 'incompatible-types'
	if (pack.type === 'MEDIA' && !MEDIA_KINDS.includes(type)) return 'incompatible-types'

	await ctx.deps.repos.packElements.create({ type, authorId: userId, packId, content })
	return null
}
