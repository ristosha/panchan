import type { Config } from '@/platform/config'
import type { Logger } from '@/platform/logger'

import type { Resources } from './resources'

/**
 * Everything a generator needs, passed explicitly (no global singletons).
 * The bot/service layer builds one of these via {@link createGenerationEngine}.
 */
export interface GenerationContext {
	config: Config
	logger: Logger
	resources: Resources
}
