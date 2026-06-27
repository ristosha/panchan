import type { Database } from '@/platform/database'

import { createAnalyticsRepository } from './analytics'
import {
	createChannelsRepository,
	createChatMembersRepository,
	createChatsRepository,
} from './chats'
import { createMediaRepository } from './media'
import { createPackElementsRepository, createPacksRepository } from './packs'
import { createMaintenanceRepository } from './sessions'
import { createPreferencesRepository, createUsersRepository } from './users'

export function createRepositories(db: Database) {
	return {
		analytics: createAnalyticsRepository(db),
		users: createUsersRepository(db),
		preferences: createPreferencesRepository(db),
		chats: createChatsRepository(db),
		chatMembers: createChatMembersRepository(db),
		channels: createChannelsRepository(db),
		packs: createPacksRepository(db),
		packElements: createPackElementsRepository(db),
		media: createMediaRepository(db),
		maintenance: createMaintenanceRepository(db),
	}
}

export type Repositories = ReturnType<typeof createRepositories>

export type { InlineSearchParams, MediaChainElement } from './media'
