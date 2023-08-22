import { type PackElementType } from '@prisma/client'

import { storage, type StorageTypes } from '~/storage.js'

export default async function (type: 'titles' | 'media', chatId?: number) {
  const inArray: PackElementType[] = type === 'titles'
    ? ['TEXT']
    : ['VIDEO', 'ANIMATION', 'PHOTO']

  const where: StorageTypes.PackElementWhereInput = chatId != null
    ? {
        type: { in: inArray },
        pack: {
          usedInChats: {
            some: { id: chatId }
          }
        }
      }
    : {
        type: { in: inArray },
        pack: {
          default: true
        }
      }

  const count = await storage.packElement.count({ where })
  if (count === 0) return null

  let skip = Math.max(0, Math.floor(Math.random() * count))
  if (count === 1) skip = 0

  const el = await storage.packElement.findFirst({ where, skip })
  if (el == null) return null

  return el
}
