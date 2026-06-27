import type { Logger as DrizzleLogger } from 'drizzle-orm'

import type { Logger } from '@/platform/logger'

// Only does any work when the underlying logger has debug enabled — the legacy
// code built an interpolated SQL string for EVERY query even at info level.
export class DatabaseLogger implements DrizzleLogger {
	constructor(private readonly logger: Logger) {}

	logQuery(query: string, params: unknown[]): void {
		if (!this.logger.isLevelEnabled('debug')) return
		this.logger.debug({ query, params }, 'query')
	}
}
