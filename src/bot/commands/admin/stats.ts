import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

export const stats = new Composer<MyContext>()

const TYPE_EMOJI: Record<string, string> = {
	DEMOTIVATOR: '🖼',
	TEXT: '✍️',
	AWARE_SCALE: '🌀',
	FISHEYE: '🐟',
	STRETCH: '↔️',
	BALLOON: '🎈',
	BOOM: '💥',
}

stats.command('stats', async ctx => {
	const { repos } = ctx.deps

	const [overview, users, chats, media, mediaUses, packs, packElements, premium, topPacks] =
		await Promise.all([
			repos.analytics.overview(),
			repos.users.countAll(),
			repos.chats.countAll(),
			repos.media.countAll(),
			repos.media.countUses(),
			repos.packs.countAll(),
			repos.packElements.countAll(),
			repos.users.countPremium(),
			repos.packs.getMostInstalled(5),
		])

	const a = overview.activity
	const trend = overview.monthly.map(m => `\`${m.m}\`  ${m.uses} (${m.uu} ppl)`).join('\n')
	const byType = overview.byType
		.map(t => `${TYPE_EMOJI[t.type] ?? '•'} \`${t.type.toLowerCase()}\`  ${t.uses} (${t.gens} gen)`)
		.join('\n')
	const packsList = topPacks.map(p => `📦 \`${p.name}\` — ${p.installCount}`).join('\n')

	const message = `📊 *Статистика panchan*

🔥 *Активность*
• сегодня: *${a.uses_24h}* исп. / *${a.uu_24h}* юзеров
• 7 дней: *${a.uses_7d}* / *${a.uu_7d}* юзеров / ${a.chats_7d} чатов
• 30 дней: *${a.uses_30d}* / *${a.uu_30d}* юзеров
👤 активных юзеров: ${overview.active.a7} (7д) · ${overview.active.a30} (30д) · ${overview.active.a90} (90д)
🆕 генераций: ${overview.gens.g7} (7д) · ${overview.gens.g30} (30д)

📈 *Тренд* (исп./мес)
${trend}

🎨 *По генераторам* (исп.)
${byType}

🌐 группы: *${overview.group}* · личка: *${overview.private}*

━━━━━━━━━━
👥 ${users} юзеров · 🗣 ${chats} чатов
📸 ${media} генераций · 📲 ${mediaUses} использований
💎 ${premium} premium · 📦 ${packs} паков / ${packElements} элементов

*Топ паков:*
${packsList}`

	await ctx.reply(message)
})
