import { type GeneratedMedia, type MediaMIME, type PackElementType } from '@prisma/client'
import { Composer } from 'grammy'
import { type InlineQueryResult } from 'grammy/types'

import { parseArgs } from '~/bot/helpers/parse-args.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage, type StorageTypes } from '~/storage.js'

export const handleSearch = new Composer<MyContext>()

handleSearch.inlineQuery(/.*/, async (ctx) => {
  const { query, offset: offsetStr } = ctx.inlineQuery

  await ctx.state.chatMember?.()

  let skip = parseInt(offsetStr)
  if (isNaN(skip)) skip = 0

  const input: StorageTypes.GeneratedMediaFindManyArgs = {
    where: {
      mime: {
        in: ['PHOTO', 'ANIMATION']
      },
      author: {
        searchIncluded: true
      },
      OR: [
        {
          chat: {
            members: {
              some: {
                user: {
                  telegramId: ctx.inlineQuery.from.id
                }
              }
            }
          }
        },
        {
          uses: {
            some: {
              usedByTelegramId: ctx.inlineQuery.from.id
            }
          }
        },
        {
          uses: {
            some: {
              chat: {
                members: {
                  some: {
                    user: {
                      telegramId: ctx.inlineQuery.from.id
                    }
                  }
                }
              }
            }
          }
        }
      ]
    },
    orderBy: {
      uses: {
        _count: 'desc'
      }
    },
    take: 30
  }

  let results: GeneratedMedia[]
  if (query == null || query.length === 0) {
    results = await storage.generatedMedia.findMany({
      ...input,
      skip
    })
  } else {
    const args = parseArgs(query)
    const searchArgs = { ...input, skip }

    if (args.rtitle === true || args.rmedia === true) {
      const types: PackElementType[] = []
      if (args.rtitle === true) types.push('TEXT')
      if (args.rmedia === true) types.push('PHOTO', 'STICKER', 'ANIMATION', 'VIDEO')

      searchArgs.where = {
        ...searchArgs.where,
        linkedPackElements: {
          some: {
            type: {
              in: types
            }
          }
        }
      }
    }

    if (args.sortdate === true) {
      searchArgs.orderBy = {
        createdAt: 'desc'
      }
    }

    if (args._.length > 0) {
      searchArgs.where = {
        ...searchArgs.where,
        content: {
          search: processString(args._)
        }
      }
    }

    results = await storage.generatedMedia.findMany(searchArgs)
  }

  const answer = results
    .map((m, id) => toInlineResult(String(skip + id), m))
    .filter(m => m != null) as InlineQueryResult[]

  await ctx.answerInlineQuery(answer, {
    cache_time: 5,
    next_offset: results.length !== 0 ? String(skip + results.length) : undefined,
    is_personal: false
  })
})

function mapMime (generatedMediaType: MediaMIME): InlineQueryResult['type'] {
  switch (generatedMediaType) {
    case 'ANIMATION':
      return 'mpeg4_gif'
    case 'PHOTO':
      return 'photo'
    case 'VIDEO':
      return 'video'
    default:
      return 'document'
  }
}

function toInlineResult (id: string, generatedMedia: GeneratedMedia): InlineQueryResult | null {
  const mime = mapMime(generatedMedia.mime)
  switch (mime) {
    case 'photo': {
      return { id, type: mime, photo_file_id: generatedMedia.resultFileId }
    }
    case 'mpeg4_gif': {
      return { id, type: mime, mpeg4_file_id: generatedMedia.resultFileId }
    }
    case 'video': {
      return { id, type: mime, title: 'Demotivator', video_file_id: generatedMedia.resultFileId }
    }
  }
  return null
}

function processString (input: string): string {
  const cleanString = input.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').toLowerCase()
  const words = cleanString.split(/\s+/)
  return words.join(':* & ') + ':*'
}
