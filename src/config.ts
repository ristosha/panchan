import { resolve } from 'path'
import * as process from 'process'
import { z } from 'znv'

await import('dotenv/config')

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development']).default('production'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  BOT_TOKEN: z.string(),
  BOT_ADMIN_ID: z.coerce.number().nullable(),
  //  BOT_WEBHOOK_URL: z.string(),
  //  BOT_SERVER_PORT: z.coerce.number(),
  BOT_LOG_CHAT_ID: z.coerce.number().nullable(),
  BOT_MP_PARSE_CHAT_ID: z.coerce.number().nullable(),
  BOT_GUIDE_URL: z.string().default('google.com'),
  BOT_FILE_PREFIX: z.string().default('ppb-'),
  AWAIT_SCALE_CHUNK: z.coerce.number().default(5),
  FFMPEG: z.string().default('ffmpeg'),
  FFPROBE: z.string().default('ffprobe'),
  IMAGE_MAGICK: z.string().default('magick')
})

export function parseConfig (env: NodeJS.ProcessEnv) {
  const config = schema.parse(env)
  return {
    ...config,
    LOTTIE_CONVERT: resolve('python ./scripts/python-lottie/bin/lottie_convert.py'),
    isDev: config.NODE_ENV === 'development',
    isProd: config.NODE_ENV === 'production'
  }
}

export const config = parseConfig(process.env)
