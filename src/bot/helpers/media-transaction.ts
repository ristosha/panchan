import fs from '@supercharge/fs'

import { type MyContext } from '~/bot/types/context.js'
import { logger } from '~/logger.js'

export interface MediaTransaction {
  ctx: MyContext
  remove: string[]
  run: () => Promise<void>
  disableLoader?: boolean
}

export async function mediaTransaction (params: MediaTransaction) {
  const {
    ctx,
    remove,
    run,
    disableLoader = false
  } = params

  let loaderMessageChatId: number | undefined
  let loaderMessageId: number | undefined
  if (!disableLoader) {
    const message = await ctx.reply('⏳')
    loaderMessageId = message.message_id
    loaderMessageChatId = message.chat.id
  }

  try {
    await run()
  } catch (e) {
    if (e instanceof Error) {
      const { message } = e
      if (message.includes('BasicParseError')) {
        if (message.includes('Parse color')) {
          const invalidColor = message.split(' ')[2]
          await ctx.reply(
            `Указан несуществующий цвет: \`${invalidColor}\`!`,
            { parse_mode: 'Markdown' }
          )
        } else {
          await ctx.reply(
            `В ваших аргументах ошибка!\n\n\`${message}\``,
            { parse_mode: 'Markdown' }
          )
        }
      } else {
        logger.error(e.message)
      }
    } else {
      logger.error(e.message)
    }
  } finally {
    await Promise.all(
      remove.map(async (f) => {
        try {
          await fs.removeFile(f)
        } catch {
        }
      })
    )

    if (loaderMessageId != null && loaderMessageChatId != null) {
      await ctx.api.deleteMessage(loaderMessageChatId, loaderMessageId)
    }
  }
}
