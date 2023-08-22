import { type Middleware } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

type MediaType = 'photo' | 'video' | 'animation' | 'photo-sticker' | 'video-sticker'
export default function (availableTypes: MediaType[]): Middleware<MyContext> {
  return async (ctx, next) => {
    const types = availableTypes
      .map(t => ctx.t(`command-no-media.${t}`))
      .join(', ')

    const msg = await ctx.reply(ctx.t('command-no-media', { types }))

    setTimeout(() => {
      void msg.delete().then().catch()
    }, 30 * 1000)
  }
}
