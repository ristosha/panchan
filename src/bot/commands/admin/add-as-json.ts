import { Composer } from 'grammy'

import { extractId } from '@/bot/helpers/extractors'
import type { MyContext } from '@/bot/types/context'

export const addAsJson = new Composer<MyContext>()

// Bulk-import a JSON array of strings as TEXT elements of a TITLES pack.
addAsJson.command('add_as_json').on('msg:document', async ctx => {
	const file = await ctx.getFile()
	if (file.file_path != null && !file.file_path.endsWith('.json')) {
		await ctx.reply('Not json!')
		return
	}

	const path = await file.download()
	let data: unknown
	try {
		data = JSON.parse(await Bun.file(path).text())
	} catch {
		await ctx.reply('Not valid json!')
		return
	}

	if (!Array.isArray(data) || typeof data[0] !== 'string') {
		await ctx.reply('Not json array of strings!')
		return
	}

	const { id } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply('NaN id!')
		return
	}

	const pack = await ctx.deps.repos.packs.getByIdAndType(id, 'TITLES')
	if (pack == null) {
		await ctx.reply('Pack is not found')
		return
	}

	const authorId = (await ctx.state.user()).id
	const count = await ctx.deps.repos.packElements.createMany(
		(data as string[]).map(content => ({ authorId, type: 'TEXT', content, packId: pack.id })),
	)

	await ctx.reply(`Inserted ${count} elements to \`${pack.name}\``)
})
