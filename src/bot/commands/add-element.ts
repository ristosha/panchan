import { type PackElementType } from '@prisma/client'
import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

import { extractId, extractMedia } from '../helpers/extractors.js'

export const addElement = new Composer<MyContext>()

const add = addElement.command('add')

add.on(['msg:animation', 'msg:video', 'msg:photo'], async (ctx) => {
  const { id: packId } = extractId(ctx)
  if (isNaN(packId)) {
    await ctx.reply(ctx.t('command-add.no-id'))
    return
  }

  const media = extractMedia(ctx)
  if (media == null) {
    await ctx.reply(ctx.t('command-add.incompatible-types'))
    return
  }

  const { fileId: content, type } = media
  if (content == null) {
    await ctx.reply(ctx.t('command-add.incompatible-types'))
    return
  }

  const result = await addPackElement({
    type,
    packId,
    content,
    authorId: (await ctx.state.user()).id
  })

  if (typeof result === 'string') {
    await ctx.reply(ctx.t(`command-add.${result}`))
    return
  }

  await ctx.reply(ctx.t('command-add.ok', { packId }))

  // await generalMenu.replyToContext(ctx, `/media/pack:${result.packId}/browser/el:${result.id}`)
})

// text!
add.on('msg', async (ctx) => {
  const { id: packId, content } = extractId(ctx)
  if (isNaN(packId)) {
    await ctx.reply(ctx.t('command-add.no-id'))
    return
  }

  if (content.length === 0) {
    await ctx.reply(ctx.t('command-add.empty'))
    return
  }

  const result = await addPackElement({
    packId,
    content,
    type: 'TEXT',
    authorId: (await ctx.state.user()).id
  })

  if (typeof result === 'string') {
    await ctx.reply(ctx.t(`command-add.${result}`))
  }

  await ctx.reply(ctx.t('command-add.ok', { packId }))
})

interface AddElementParams {
  authorId: number
  packId: number
  type: PackElementType
  content: string
}

async function addPackElement (params: AddElementParams) {
  const { authorId, packId, type, content } = params
  const pack = await storage.pack.findUnique({
    where: {
      id: packId,
      OR: [
        { authorId },
        { editors: { some: { id: authorId } } }
      ]
    }
  })

  if (pack == null) {
    return 'not-found'
  }

  if (pack?.type === 'TITLES' && type !== 'TEXT') {
    return 'incompatible-types'
  } else if (pack?.type === 'MEDIA' && !(['VIDEO', 'ANIMATION', 'PHOTO'].includes(type))) {
    return 'incompatible-types'
  }

  const result = await storage.packElement.create({ data: { type, authorId, packId, content } })
  return result
}
