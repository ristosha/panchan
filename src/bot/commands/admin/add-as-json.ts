import fs from '@supercharge/fs'
import { Composer } from 'grammy'

import { extractId } from '~/bot/helpers/extractors.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const addAsJson = new Composer<MyContext>()
const command = addAsJson.command('add_as_json')

command.on('msg:document', async (ctx) => {
  const file = await ctx.getFile()
  if (file.file_path?.endsWith('.json') === false) {
    await ctx.reply('Not json!')
    return
  }

  const downloaded = await file.download()
  const content = await fs.content(downloaded)
  const data = JSON.parse(content)
  if (!Array.isArray(data) || typeof data[0] !== 'string') {
    await ctx.reply('Not json array of strings!')
    return
  }

  const { id } = extractId(ctx)
  if (isNaN(id)) {
    await ctx.reply('NaN id!')
    return
  }

  const pack = await storage.pack.findFirst({
    where: { id, type: 'TITLES' }
  })

  if (pack == null) {
    await ctx.reply('Pack is not found')
    return
  }

  const authorId = (await ctx.state.user()).id
  const res = await storage.packElement.createMany({
    data: data.map(el => ({
      authorId,
      type: 'TEXT',
      content: el,
      packId: pack.id
    }))
  })

  await ctx.reply(`Inserted ${res.count} elements to \`${pack.name}\``)
})
