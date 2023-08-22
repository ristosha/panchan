import { run } from '@grammyjs/runner'
import { GlobalFonts } from '@napi-rs/canvas'

import { emojiFonts, fallbackFonts, fonts } from '~/api/resources.js'
import { bot } from '~/bot/index.js'
import { logger } from '~/logger.js'
import { storage } from '~/storage.js'

logger.info('Loading all fonts...')
const allFonts = [...fonts, ...fallbackFonts, ...emojiFonts]
allFonts.forEach(f => {
  logger.info(`+ [font] ${f.name} (${f.path})`)
  GlobalFonts.registerFromPath(f.path, f.name)
})

logger.info('Connecting to database...')
await storage.$connect()
logger.info('Connected to database!')

logger.info('Starting a bot!')
run(bot)
