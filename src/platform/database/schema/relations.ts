import { relations } from 'drizzle-orm'

import {
	chatEnabledPacks,
	chatMembers,
	chats,
	generatedMedia,
	generatedMediaUses,
	linkedPackElements,
	packEditingByUser,
	packElements,
	packs,
	userCommandsPreferences,
	users,
} from './entities'

export const usersRelations = relations(users, ({ many }) => ({
	chatMembers: many(chatMembers),
	commandPreferences: many(userCommandsPreferences),
	generatedMedia: many(generatedMedia),
	ownedPacks: many(packs),
	packElements: many(packElements),
	packEditing: many(packEditingByUser),
}))

export const chatsRelations = relations(chats, ({ many }) => ({
	members: many(chatMembers),
	generatedMedia: many(generatedMedia),
	generatedMediaUses: many(generatedMediaUses),
	enabledPacks: many(chatEnabledPacks),
}))

export const chatMembersRelations = relations(chatMembers, ({ one }) => ({
	user: one(users, { fields: [chatMembers.userId], references: [users.id] }),
	chat: one(chats, { fields: [chatMembers.chatId], references: [chats.id] }),
}))

export const packsRelations = relations(packs, ({ one, many }) => ({
	author: one(users, { fields: [packs.authorId], references: [users.id] }),
	elements: many(packElements),
	enabledInChats: many(chatEnabledPacks),
	editors: many(packEditingByUser),
}))

export const packElementsRelations = relations(packElements, ({ one, many }) => ({
	pack: one(packs, { fields: [packElements.packId], references: [packs.id] }),
	author: one(users, { fields: [packElements.authorId], references: [users.id] }),
	linkedMedia: many(linkedPackElements),
}))

export const generatedMediaRelations = relations(generatedMedia, ({ one, many }) => ({
	author: one(users, { fields: [generatedMedia.authorId], references: [users.id] }),
	chat: one(chats, { fields: [generatedMedia.chatId], references: [chats.id] }),
	uses: many(generatedMediaUses),
	linkedElements: many(linkedPackElements),
}))

export const generatedMediaUsesRelations = relations(generatedMediaUses, ({ one }) => ({
	media: one(generatedMedia, {
		fields: [generatedMediaUses.generatedMediaId],
		references: [generatedMedia.id],
	}),
	chat: one(chats, { fields: [generatedMediaUses.chatId], references: [chats.id] }),
}))

export const userCommandsPreferencesRelations = relations(userCommandsPreferences, ({ one }) => ({
	user: one(users, { fields: [userCommandsPreferences.userId], references: [users.id] }),
}))

export const chatEnabledPacksRelations = relations(chatEnabledPacks, ({ one }) => ({
	chat: one(chats, { fields: [chatEnabledPacks.a], references: [chats.id] }),
	pack: one(packs, { fields: [chatEnabledPacks.b], references: [packs.id] }),
}))

export const linkedPackElementsRelations = relations(linkedPackElements, ({ one }) => ({
	media: one(generatedMedia, { fields: [linkedPackElements.a], references: [generatedMedia.id] }),
	element: one(packElements, { fields: [linkedPackElements.b], references: [packElements.id] }),
}))

export const packEditingByUserRelations = relations(packEditingByUser, ({ one }) => ({
	pack: one(packs, { fields: [packEditingByUser.a], references: [packs.id] }),
	user: one(users, { fields: [packEditingByUser.b], references: [users.id] }),
}))
