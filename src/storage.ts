
import { type Prisma, PrismaClient } from '@prisma/client'

import { logger } from '~/logger.js'

export { type Prisma as StorageTypes }

export const storage = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' }
  ]
})

function parseParams (parameters: string): unknown[] {
  try {
    return JSON.parse(parameters) as unknown[]
  } catch {
    return []
  }
}

storage.$on('query', (e: Prisma.QueryEvent) => {
  const quotedDateParams = e.params.replace(
    /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.?\d* UTC/g,
    (date) => `"${date}"`
  )

  const parameters = parseParams(quotedDateParams)
  const query = e.query.replace(
    /(\?|\$\d+)/g,
    (match, param, offset, string: string) => {
      const parameter = JSON.stringify(parameters.shift())
      const previousChar = string.charAt(offset - 1)

      return (previousChar === ',' ? ' ' : '') + parameter
    }
  )

  logger.debug({
    msg: 'database query',
    query,
    duration: e.duration
  })
})

storage.$on('error', (e: Prisma.LogEvent) => {
  logger.error({
    msg: 'database error',
    target: e.target,
    message: e.message
  })
})

storage.$on('info', (e: Prisma.LogEvent) => {
  logger.info({
    msg: 'database info',
    target: e.target,
    message: e.message
  })
})

storage.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn({
    msg: 'database warning',
    target: e.target,
    message: e.message
  })
})
