import { type PackElementType } from '@prisma/client'
import { Composer } from 'grammy'

import { extractId, extractMedia } from '~/bot/helpers/extractors.js'
import autoQuote from '~/bot/middlewares/auto-quote.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const editElement = new Composer<MyContext>()
const edit = editElement.command('editel')
edit.use(autoQuote())

edit.on(['msg:photo', 'msg:video', 'msg:animation'], async (ctx) => {
  const { id } = extractId(ctx)
  if (isNaN(id)) {
    await ctx.reply(ctx.t('command-add.no-id'))
    return
  }

  const { fileId: content, type } = extractMedia(ctx)
  if (content == null) {
    await ctx.reply(ctx.t('command-add.incompatible-types'))
    return
  }

  const { id: userId } = await ctx.state.user()
  const updated = await editPackElement({
    id,
    type,
    userId,
    content
  })
  if (typeof updated === 'string') {
    await ctx.reply(ctx.t(`command-add.${updated}`))
    return
  }

  await ctx.reply(ctx.t('command-edit', { id }))
})

edit.on('msg', async (ctx) => {
  const { id, content } = extractId(ctx)
  if (isNaN(id)) {
    await ctx.reply(ctx.t('command-add.no-id'))
  }

  const { id: userId } = await ctx.state.user()
  const updated = await editPackElement({
    id,
    userId,
    content,
    type: 'TEXT'
  })
  if (typeof updated === 'string') {
    await ctx.reply(ctx.t(`command-add.${updated}`))
    return
  }

  await ctx.reply(ctx.t('command-edit', { id }))
})

interface EditPackElementParams {
  id: number
  userId: number
  type: PackElementType
  content: string
}

async function editPackElement (params: EditPackElementParams) {
  const { id, userId, content, type } = params
  const element = await storage.packElement.findFirst({
    where: {
      id,
      pack: {
        OR: [
          { authorId: userId },
          { editors: { some: { id: userId } } }
        ]
      }
    },
    include: {
      pack: { select: { type: true } }
    }
  })

  if (element == null) {
    return 'not-found'
  }

  if (element.pack.type === 'TITLES' && type !== 'TEXT') {
    return 'incompatible-types'
  } else if (element.pack.type === 'MEDIA' && !(['VIDEO', 'ANIMATION', 'PHOTO'].includes(type))) {
    return 'incompatible-types'
  }

  const pack = await storage.packElement.update({
    where: { id },
    data: { content, authorId: userId }
  })

  return pack
}
