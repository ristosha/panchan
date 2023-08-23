import { type GeneratedMedia, type MediaMIME } from '@prisma/client'
import { Composer } from 'grammy'
import { type InlineQueryResult } from 'grammy/types'

import { type MyContext } from '~/bot/types/context.js'
import { storage, type StorageTypes } from '~/storage.js'

export const handleSearch = new Composer<MyContext>()

const input: StorageTypes.GeneratedMediaFindManyArgs = {
  where: {
    mime: {
      in: ['PHOTO', 'ANIMATION']
    },
    author: {
      searchIncluded: true
    }
  },
  orderBy: {
    uses: {
      _count: 'desc'
    }
  },
  take: 30
}

handleSearch.inlineQuery(/.*/, async (ctx) => {
  const { query, offset: offsetStr } = ctx.inlineQuery

  let skip = parseInt(offsetStr)
  if (isNaN(skip)) skip = 0

  let results: GeneratedMedia[]
  if (query == null || query.length === 0) {
    results = await storage.generatedMedia.findMany({
      ...input,
      skip
    })
  } else {
    results = await storage.generatedMedia.findMany({
      ...input,
      skip,
      where: {
        content: {
          search: processString(query)
        }
      }
    })
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
