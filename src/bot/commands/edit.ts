import { Composer } from 'grammy'

import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import { getOriginalMediaByCtx } from '~/bot/helpers/get-original-media.js'
import { bot } from '~/bot/index.js'
import { type MyContext } from '~/bot/types/context.js'

export const edit = new Composer<MyContext>()
const command = edit.command(['edit', 'ed', 'ред'])

command.use(rateLimit)

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

    const update = Object.create(ctx.update)
    update.message.text = `/${found.type.toLowerCase()} ${ctx.match}`

    const file = await ctx.api.getFile(found.source_file_id)
    if (found.mime === 'PHOTO') {
      update.message.photo = [file]
    } else {
      update.message[found.mime.toLowerCase()] = file
    }

    await bot.handleUpdate(update)
  })
