import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const stats = new Composer<MyContext>()
const command = stats.command('stats')

command.use(async (ctx) => {
  // Fetch various statistics using Prisma ORM queries
  const [
    users,
    userPrivate,
    userGroup,
    chats,
    chatMember,
    generatedMedia,
    generatedMediaNonRandom,
    generatedMediaUses,
    packs,
    packElements
  ] = await Promise.all([
    storage.user.count(),
    storage.user.count({ where: { lastPrivateContactedAt: { not: null } } }),
    storage.user.count({ where: { lastGroupContactedAt: { not: null } } }),
    storage.chat.count(),
    storage.chatMember.count(),
    storage.generatedMedia.count(),
    storage.generatedMedia.count({ where: { linkedPackElements: { none: {} } } }),
    storage.generatedMediaUses.count(),
    storage.pack.count(),
    storage.packElement.count()
  ])

  const [bigChats, lastChats, mostInstalledPacks] = await Promise.all([
    storage.chat.findMany({ orderBy: { memberCount: 'desc' }, take: 5 }),
    storage.chat.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    storage.pack.findMany({
      orderBy: { usedInChats: { _count: 'desc' } },
      include: { _count: { select: { usedInChats: true } } },
      take: 10
    })
  ])

  const replyMessage = `
📊 Bot Statistics:

👥 Users: ${users}
🕊 Users in Private Chats: ${userPrivate}
👥 Users in Group Chats: ${userGroup}
🗣 Total Chats: ${chats}
👤 Chat Members: ${chatMember}
📸 Generated Media: ${generatedMedia}
📸 Non-random Generated Media: ${generatedMediaNonRandom}
📲 Media Uses: ${generatedMediaUses}
📦 Packs: ${packs}
🎨 Pack Elements: ${packElements}

Most installed Packs:
${mostInstalledPacks.map(p => `📦 \`${p.name}\` - ${p._count.usedInChats} chats`).join('\n')}

Most Populous Chats:
${bigChats.map(chat => `👥 \`${String(chat.title)}\` - ${chat.memberCount}`).join('\n')}

Latest Chats:
${lastChats.map(chat => `🗓  \`${String(chat.title)}\` - ${chat.memberCount}`).join('\n')}
`

  await ctx.reply(replyMessage)
})
