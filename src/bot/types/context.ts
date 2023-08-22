import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations'
import { type FileApiFlavor, type FileFlavor } from '@grammyjs/files'
import { type HydrateApiFlavor, type HydrateFlavor } from '@grammyjs/hydrate'
import { type I18nFlavor } from '@grammyjs/i18n'
import { type ParseModeFlavor } from '@grammyjs/parse-mode'
import { type Channel, type Chat, type ChatMember, type User } from '@prisma/client'
import { type Api, type Context, type SessionFlavor } from 'grammy'

import { type SessionData } from '~/bot/plugins/sessions.js'

export interface State {
  state: {
    user: (forceUpdate?: boolean) => Promise<User>
    chat?: (forceUpdate?: boolean) => Promise<Chat>
    chatMember?: (forceUpdate?: boolean) => Promise<ChatMember>
    channel?: (forceUpdate: boolean) => Promise<Channel>
    data: any
  }
}

export type MyContext = HydrateFlavor<ParseModeFlavor<FileFlavor<Context & State & I18nFlavor & ConversationFlavor & SessionFlavor<SessionData>>>>
export type MyApi = HydrateApiFlavor<FileApiFlavor<Api>>
export type MyConversation = Conversation<MyContext>
