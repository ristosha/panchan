import { writeFile } from 'node:fs/promises'
import { run } from '@grammyjs/runner'

import { createBot } from '@/bot'
import { createContainer } from '@/container'
import { HEARTBEAT_FILE } from '@/scripts/healthcheck'

const container = await createContainer()
const { logger } = container

const bot = createBot(container)

await bot.init()
logger.info({ username: bot.botInfo.username }, 'starting bot')

// liveness heartbeat for the container HEALTHCHECK
const beat = () => writeFile(HEARTBEAT_FILE, String(Date.now())).catch(() => {})
await beat()
const heartbeat = setInterval(beat, 15_000)

const runner = run(bot, { sink: { concurrency: 6 } })

const stop = async (signal: string) => {
	logger.info({ signal }, 'shutting down')
	clearInterval(heartbeat)
	if (runner.isRunning()) await runner.stop()
	await container.db.disconnect().catch(() => {})
	process.exit(0)
}

process.once('SIGINT', () => void stop('SIGINT'))
process.once('SIGTERM', () => void stop('SIGTERM'))
