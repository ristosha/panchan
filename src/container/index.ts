import { type Config, createConfig } from '@/platform/config'
import { createDatabase, type Database } from '@/platform/database'
import { createLogger, type Logger } from '@/platform/logger'
import { createRepositories, type Repositories } from '@/repositories'
import { createGenerationEngine, type GenerationEngine } from '@/services/generation'
import { GenerationQueue } from '@/services/queue'

export interface Container {
	config: Config
	logger: Logger
	db: Database
	repos: Repositories
	gen: GenerationEngine
	queue: GenerationQueue
}

/** Build and wire every long-lived dependency. Called once at process start. */
export async function createContainer(
	env: Record<string, string | undefined> = process.env,
): Promise<Container> {
	const config = createConfig(env)
	const logger = createLogger({ level: config.LOG_LEVEL, format: config.LOG_FORMAT })

	logger.info('connecting to database')
	const db = await createDatabase(logger, {
		url: config.DATABASE_URL,
		maxConnections: config.DB_MAX_CONNECTIONS,
	})

	const repos = createRepositories(db)

	logger.info('loading generation engine (fonts/templates)')
	const gen = await createGenerationEngine({ config, logger })

	const queue = new GenerationQueue(logger.named('queue'), config.GEN_CONCURRENCY)

	return { config, logger, db, repos, gen, queue }
}
