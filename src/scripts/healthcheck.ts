// Container HEALTHCHECK: the bot touches HEARTBEAT_FILE on an interval while its
// update loop is alive (see bootstrap). If the file is stale the long-poll loop
// has wedged and the orchestrator should restart the container.

import { stat } from 'node:fs/promises'

export const HEARTBEAT_FILE = '/tmp/panchan-heartbeat'
const MAX_AGE_MS = 60_000

// Only run the check when executed directly (HEALTHCHECK). When imported just for
// HEARTBEAT_FILE (e.g. by index.ts) this block must NOT run, or it would exit.
if (import.meta.main) {
	try {
		const { mtimeMs } = await stat(HEARTBEAT_FILE)
		const age = Date.now() - mtimeMs
		if (age > MAX_AGE_MS) {
			console.error(`heartbeat stale: ${Math.round(age / 1000)}s`)
			process.exit(1)
		}
		process.exit(0)
	} catch {
		console.error('heartbeat missing')
		process.exit(1)
	}
}
