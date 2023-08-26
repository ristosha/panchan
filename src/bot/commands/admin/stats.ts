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
    generatedMediaText,
    generatedMediaStretch,
    generatedMediaDemotivator,
    generatedMediaBalloon,
    generatedMediaFisheye,
    generatedMediaScale,
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
    storage.generatedMedia.count({ where: { type: 'TEXT' } }),
    storage.generatedMedia.count({ where: { type: 'STRETCH' } }),
    storage.generatedMedia.count({ where: { type: 'DEMOTIVATOR' } }),
    storage.generatedMedia.count({ where: { type: 'BALLOON' } }),
    storage.generatedMedia.count({ where: { type: 'FISHEYE' } }),
    storage.generatedMedia.count({ where: { type: 'AWARE_SCALE' } }),
    storage.generatedMediaUses.count(),
    storage.pack.count(),
    storage.packElement.count()
  ])

  const [bigChats, lastChats, mostInstalledPacks] = await Promise.all([
    storage.chat.findMany({
      orderBy: {
        memberCount: 'desc'
      },
      include: {
        _count: {
          select: { generatedMedia: true, members: true }
        }
      },
      take: 5
    }),
    storage.chat.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { generatedMedia: true, members: true }
        }
      },
      take: 5
    }),
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

Generated media:
/text - ${generatedMediaText} times
/dem - ${generatedMediaDemotivator} times
/stretch - ${generatedMediaStretch} times
/fisheye - ${generatedMediaFisheye} times
/scale - ${generatedMediaScale} times
/balloon - ${generatedMediaBalloon} times

Most installed Packs:
${mostInstalledPacks
    .map(p =>
      `📦 \`${p.name}\` - ${p._count.usedInChats} chats`)
    .join('\n')}

Most Populous Chats:
${bigChats
    .map(chat => `👥 \`${String(chat.title)}\` - ${chat._count.members}/${chat.memberCount} m. (${chat._count.generatedMedia} media)`)
    .join('\n')}

Latest Chats:
${lastChats.map(chat => `🗓  \`${String(chat.title)}\` - ${chat._count.members}/${chat.memberCount} m. (${chat._count.generatedMedia} media)`).join('\n')}
`

  await ctx.reply(replyMessage)
})
