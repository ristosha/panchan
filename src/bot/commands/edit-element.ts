import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { extractId, extractMedia, type PackElementKind } from './pack-extractors'

const MEDIA_KINDS: PackElementKind[] = ['VIDEO', 'ANIMATION', 'PHOTO']

/** `/editel <elementId> <content|media>` — overwrite an element you own/edit. */
export const editElement = new Composer<MyContext>()
const edit = editElement.command('editel')

edit.on(['msg:photo', 'msg:video', 'msg:animation'], async ctx => {
	const { id } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply(ctx.t('command-add.no-id'))
		return
	}

	const { fileId, type } = extractMedia(ctx)
	if (fileId == null) {
		await ctx.reply(ctx.t('command-add.incompatible-types'))
		return
	}

	const result = await editPackElement(ctx, id, type, fileId)
	if (result != null) {
		await ctx.reply(ctx.t(`command-add.${result}`))
		return
	}
	await ctx.reply(ctx.t('command-edit', { id }))
})

edit.on('msg', async ctx => {
	const { id, content } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply(ctx.t('command-add.no-id'))
		return
	}

	const result = await editPackElement(ctx, id, 'TEXT', content)
	if (result != null) {
		await ctx.reply(ctx.t(`command-add.${result}`))
		return
	}
	await ctx.reply(ctx.t('command-edit', { id }))
})

async function editPackElement(
	ctx: MyContext,
	id: number,
	type: PackElementKind,
	content: string,
): Promise<'not-found' | 'incompatible-types' | null> {
	const userId = (await ctx.state.user()).id
	const element = await ctx.deps.repos.packElements.getOwnWithPackType(id, userId)
	if (element == null) return 'not-found'

	if (element.packType === 'TITLES' && type !== 'TEXT') return 'incompatible-types'
	if (element.packType === 'MEDIA' && !MEDIA_KINDS.includes(type)) return 'incompatible-types'

	await ctx.deps.repos.packElements.update(id, { content, authorId: userId })
	return null
}
