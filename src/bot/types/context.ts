import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { FileApiFlavor, FileFlavor } from '@grammyjs/files'
import type { HydrateApiFlavor, HydrateFlavor } from '@grammyjs/hydrate'
import type { I18nFlavor } from '@grammyjs/i18n'
import type { ParseModeFlavor } from '@grammyjs/parse-mode'
import type { Api, Context, LazySessionFlavor } from 'grammy'

import type { Container } from '@/container'
import type { channel, chatMembers, chats, users } from '@/platform/database'

export type UserRow = typeof users.$inferSelect
export type ChatRow = typeof chats.$inferSelect
export type ChatMemberRow = typeof chatMembers.$inferSelect
export type ChannelRow = typeof channel.$inferSelect

export interface SessionData {
	language?: string
	// transient UI state (menu navigation etc.)
	data: Record<string, unknown>
}

/** Long-lived dependencies, attached to every context by the deps middleware. */
export interface DepsFlavor {
	deps: Container
}

/** Lazily-resolved, per-update memoized entity getters (no DB hit until called). */
export interface StateFlavor {
	state: {
		user: () => Promise<UserRow>
		chat?: () => Promise<ChatRow>
		chatMember?: () => Promise<ChatMemberRow>
		channel?: () => Promise<ChannelRow>
	}
}

type Base = Context & DepsFlavor & StateFlavor & I18nFlavor & LazySessionFlavor<SessionData>

type WithPlugins = HydrateFlavor<ParseModeFlavor<FileFlavor<Base>>>

export type MyContext = ConversationFlavor<WithPlugins>
export type MyApi = HydrateApiFlavor<FileApiFlavor<Api>>

// Context used INSIDE conversations (no ConversationFlavor; plugins re-installed
// via the conversations `plugins` option as needed).
export type MyConversationContext = HydrateFlavor<
	ParseModeFlavor<FileFlavor<Context & DepsFlavor & I18nFlavor>>
>
export type MyConversation = Conversation<MyContext, MyConversationContext>
