import { InlineKeyboard } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

interface EditOrReplyParams {
  ctx: MyContext
  edit: boolean
  content: string
  keyboard?: InlineKeyboard | null
}

export default async function (params: EditOrReplyParams) {
  const {
    ctx,
    edit,
    content,
    keyboard = undefined
  } = params

  const opts = {
    disable_web_page_preview: true,
    reply_markup: keyboard == null ? new InlineKeyboard() : keyboard
  }

  if (edit) {
    await ctx.editMessageText(content, opts)
  } else {
    await ctx.reply(content, opts)
  }
}
