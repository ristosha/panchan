import { createConversation } from '@grammyjs/conversations'
import { Composer } from 'grammy'

import { createPack } from '~/bot/conversations/create-pack.js'
import { deletePack } from '~/bot/conversations/delete-pack.js'
import { editPackDescription } from '~/bot/conversations/edit-pack-description.js'
import { editPackNsfw } from '~/bot/conversations/edit-pack-nsfw.js'
import { editPackPrivacy } from '~/bot/conversations/edit-pack-privacy.js'
import { type MyContext } from '~/bot/types/context.js'

export const conversations = new Composer<MyContext>()

conversations.use(createConversation(createPack, { id: 'create-pack' }))
conversations.use(createConversation(editPackPrivacy, { id: 'edit-privacy' }))
conversations.use(createConversation(editPackDescription, { id: 'edit-desc' }))
conversations.use(createConversation(editPackNsfw, { id: 'edit-nsfw' }))
conversations.use(createConversation(deletePack, { id: 'delete-pack' }))
