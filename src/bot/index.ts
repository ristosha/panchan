import { Bot, InputFile } from 'grammy'

import { commands } from '~/bot/commands/index.js'
import { conversations } from '~/bot/conversations/index.js'
import { layouts } from '~/bot/layouts/index.js'
import ignoreOld from '~/bot/middlewares/ignore-old.js'
import { middlewares } from '~/bot/middlewares/index.js'
import { plugins } from '~/bot/plugins/index.js'
import { type MyApi, type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'
import { logger } from '~/logger.js'

export const bot = new Bot<MyContext, MyApi>(config.BOT_TOKEN)

bot.catch(async ({ ctx, message, name, error }) => {
  logger.error(name)
  logger.error(error)

  await ctx.reply(ctx.t('bot-error')).catch()

  if (config.BOT_LOG_CHAT_ID != null) {
    try {
      const ctxStr = JSON.stringify(ctx, null, 2)
      const msg = await ctx.forwardMessage(config.BOT_LOG_CHAT_ID).catch()

      await ctx.api.sendDocument(
        config.BOT_LOG_CHAT_ID,
        new InputFile(Buffer.from(ctxStr), 'context.txt'),
        {
          caption: `\`${message.substring(0, 512)}\``,
          reply_to_message_id: msg.message_id
        }
      )
    } catch (e) {
      logger.error(e)
    }
  }
})

bot.use(ignoreOld())

bot.use(plugins)
bot.use(middlewares)

bot.use(conversations)
bot.use(layouts)

bot.use(commands)
