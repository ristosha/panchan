import fs from '@supercharge/fs'

import { TooManyFrames } from '~/api/errors.js'
import { QueueManager } from '~/bot/helpers/queue.js'
import { type MyContext } from '~/bot/types/context.js'
import { logger } from '~/logger.js'

export interface MediaTransaction {
  ctx: MyContext
  queue?: string
  remove: string[]
  run: () => Promise<void>
  disableLoader?: boolean
}

const queues = new QueueManager()

export async function mediaTransaction (params: MediaTransaction) {
  const {
    ctx,
    remove,
    run,
    queue: queueName,
    disableLoader = false
  } = params

  let loaderMessageChatId: number | undefined
  let loaderMessageId: number | undefined
  if (!disableLoader) {
    const message = await ctx.reply('⏳')
    loaderMessageId = message.message_id
    loaderMessageChatId = message.chat.id
  }

  const queue = queues.getQueue(queueName)
  let queueMessageId: number | undefined
  let queueChatId: number | undefined

  const queueSize = queue.length() + 1
  if (queueSize > 2 || queue.isPending()) {
    const est = queue.calculateEstimatedTime(queue.length())
    const message = await ctx.reply(ctx.t('queue', {
      pos: queueSize,
      length: queueSize,
      estimated: est <= 0 ? '??' : est
    }))
    queueMessageId = message.message_id
    queueChatId = message.chat.id
  }

  const step = queueSize < 3 ? 1 : queueSize < 10 ? queueSize / 6 : queueSize / 4

  queue.enqueue({
    task: async () => {
      await run()
    },
    onProcessing: async () => {
      if (queueChatId != null && queueMessageId != null) {
        await ctx.api.deleteMessage(queueChatId, queueMessageId).catch()
      }
    },
    onStep: async (pos, length, estimated) => {
      if (pos !== 1 && pos % step === 0 && queueMessageId != null && queueChatId != null) {
        const est = Math.floor(estimated + 1)

        await ctx.api.editMessageText(
          queueChatId,
          queueMessageId,
          ctx.t('queue', {
            pos,
            length,
            estimated: est <= 0 ? '?' : est
          })
        )
      }
    },
    onComplete: async () => {
      await Promise.all(
        remove.map(async (f) => {
          try {
            await fs.removeFile(f)
          } catch {
          }
        })
      )

      if (loaderMessageId != null && loaderMessageChatId != null) {
        await ctx.api.deleteMessage(loaderMessageChatId, loaderMessageId).catch()
      }
    },
    onError: async (e) => {
      if (e instanceof TooManyFrames) {
        await ctx.reply(ctx.t('command-aware-scale.too-many-frames', {
          error: e.message
        }))
      } else if (e instanceof Error) {
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
    }
  })
}
