import { LoggerOptions, pino } from 'pino'
import { config } from '~/config.js'

const options: LoggerOptions = {
  level: config.LOG_LEVEL,
  depthLimit: config.isDev ? 5 : 2
}

const transport = pino.transport({
  targets: [
    {
      target: 'pino-pretty',
      level: config.LOG_LEVEL,
      options: {
        ...(config.isDev && {
          ignore: 'pid,hostname',
          colorize: true,
          translateTime: true
        })
      }
    }
  ]
})

export const logger = pino(options, transport)
