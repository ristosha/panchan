// Retention cleanup — run on a schedule (cron / `bun run prune`).
// Removes abandoned sessions and old media-use rows that grow without bound.

import { createContainer } from '@/container'

const container = await createContainer()
const { logger, config, repos } = container

const sessions = await repos.maintenance.pruneSessions(config.SESSION_TTL_DAYS)
const uses = await repos.maintenance.pruneMediaUses(config.USES_TTL_DAYS)

logger.info({ sessions, uses }, 'prune complete')

await container.db.disconnect().catch(() => {})
process.exit(0)
