import { Composer } from 'grammy'

import { getOriginalMediaByCtx } from '~/bot/helpers/get-original-media.js'
import { bot } from '~/bot/index.js'
import { type MyContext } from '~/bot/types/context.js'

export const reroll = new Composer<MyContext>()
const command = reroll.command(['reroll', 'реролл', 'рр', 'рерол', 'rr'])

// command.use(rateLimit)

command.on(
  [
    'msg:animation',
    'msg:photo',
    'msg:video',
    'msg:video_note'
  ])
  .use(async ctx => {
    const chain = await getOriginalMediaByCtx(ctx)
    if (chain == null) {
      await ctx.reply(ctx.t('command-orig.not-found'))
      return
    }

    const found = chain[0]
    if (found.type !== 'DEMOTIVATOR' && found.type !== 'TEXT') return

    const update = Object.create(ctx.update)
    update.message.text = `/r${found.type.toLowerCase()}`

    const file = await ctx.api.getFile(found.source_file_id)
    if (found.mime === 'PHOTO') {
      update.message.photo = [file]
    } else {
      update.message[found.mime.toLowerCase()] = file
    }

    await bot.handleUpdate(update)
  })
