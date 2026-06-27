import { Composer } from 'grammy'

import { refreshDefaultPackIds } from '@/bot/helpers/default-packs'
import { extractId } from '@/bot/helpers/extractors'
import type { MyContext } from '@/bot/types/context'

export const setDefault = new Composer<MyContext>()

setDefault.command('set_default', async ctx => {
	const { id } = extractId(ctx)
	if (Number.isNaN(id)) {
		await ctx.reply('No id!')
		return
	}

	const pack = await ctx.deps.repos.packs.getById(id)
	if (pack == null) {
		await ctx.reply('Pack is not found')
		return
	}

	await ctx.deps.repos.packs.setDefault(id, !pack.default)
	await ctx.reply(`Pack default is \`${String(!pack.default)}\` now!`)

	// keep the default-pack cache (used by the chat getter) in sync
	await refreshDefaultPackIds(ctx.deps.repos)
})
