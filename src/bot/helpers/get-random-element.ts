import { type PackElementType } from '@prisma/client'

import { storage, type StorageTypes } from '~/storage.js'

function countLines (str: string): number {
  return str.split('\n').length
}

export default async function getRandomElement (type: 'titles' | 'media', chatId?: number, maxLines?: number, tries = 0) {
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

  if (maxLines != null && type === 'titles' && countLines(el.content) > maxLines) {
    if (tries > 5) return null

    const res = await getRandomElement(type, chatId, maxLines, tries + 1)
    return res
  }

  return el
}
