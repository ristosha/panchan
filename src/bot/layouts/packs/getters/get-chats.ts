import { storage } from '~/storage.js'

export async function getOwnChats (userId: number) {
  const chats = await storage.chat.findMany({
    where: {
      members: {
        some: {
          userId,
          role: {
            in: ['ADMIN', 'CREATOR']
          }
        }
      }
    },
    include: {
      packs: {
        select: {
          id: true
        }
      },
      members: {
        select: {
          userId: true,
          role: true
        },
        where: {
          role: {
            in: ['ADMIN', 'CREATOR']
          }
        }
      }
    }
  })
  return chats
}
