import { Composer } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'
import { storage } from '~/storage.js'

export const autoUploader = new Composer<MyContext>()

autoUploader
  .chatType('group')
  .on('msg:animation')
  .filter(ctx =>
    ctx.chat.id === config.BOT_MP_PARSE_CHAT_ID && config.BOT_MP_PARSE_CHAT_ID != null
  )
  .use(async ctx => {
    const fileId = ctx.msg.animation.file_id
    const pack = await storage.pack.findFirst({
      where: {
        type: 'MEDIA',
        default: true
      }
    })

    if (pack == null) {
      await ctx.reply('Default media pack is not exists')
      return
    }

    await storage.packElement.create({
      data: {
        type: 'ANIMATION',
        content: fileId,
        authorId: (await ctx.state.user()).id,
        packId: pack.id
      }
    })

    await ctx.reply('Inserted!')
  })
