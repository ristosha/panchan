import { Composer } from 'grammy'

import { extractId } from '~/bot/helpers/extractors.js'
import { packs } from '~/bot/middlewares/set-chat.js'
import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export const setDefault = new Composer<MyContext>()
const command = setDefault.command('set_default')

command.use(async ctx => {
  const { id } = extractId(ctx)
  if (isNaN(id)) {
    await ctx.reply('No id!')
    return
  }

  const pack = await storage.pack.findFirst({
    where: {
      id
    }
  })

  if (pack == null) {
    await ctx.reply('Pack is not found')
    return
  }

  await storage.pack.update({
    where: { id },
    data: { default: !pack.default }
  })

  await ctx.reply(`Pack default is \`${String(!pack.default)}\` now!`)

  packs.defaultPacks = await storage.pack.findMany({
    where: {
      default: true
    },
    select: {
      id: true
    }
  })
})
