import { type Context, type NextFunction } from 'grammy'

import { logger } from '~/logger.js'

export default function ignoreOld<T extends Context> (threshold = 5 * 60) {
  return async function (ctx: T, next: NextFunction) {
    const currentTimestamp = Date.now() / 1000
    const messageTimestamp = ctx?.msg?.date

    if (
      messageTimestamp !== undefined &&
      currentTimestamp - messageTimestamp > threshold
    ) {
      const userId = ctx.from?.id ?? 'unknown'
      const chatId = ctx.chat?.id ?? 'unknown'
      logger.debug(
        `Ignoring message from user ${userId} at chat ${chatId}.` +
        `(currentTimestamp: ${currentTimestamp}, messageTimestamp: ${messageTimestamp})`
      )
      return
    }

    await next()
  }
}
