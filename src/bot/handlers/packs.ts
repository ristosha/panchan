import { createConversation } from '@grammyjs/conversations'
import type { Bot } from 'grammy'

import { addElement } from '@/bot/commands/add-element'
import { demote } from '@/bot/commands/demote'
import { editElement } from '@/bot/commands/edit-element'
import { forceChatMemberUpdate } from '@/bot/commands/force-chat-member-update'
import { forceChatUpdate } from '@/bot/commands/force-chat-update'
import { promote } from '@/bot/commands/promote'
import { createPackConversation } from '@/bot/conversations/create-pack'
import { deletePackConversation } from '@/bot/conversations/delete-pack'
import { editPackConversation } from '@/bot/conversations/edit-pack-privacy'
import { conversationPlugins } from '@/bot/conversations/shared'
import { generalMenu } from '@/bot/layouts'
import type { MyApi, MyContext } from '@/bot/types/context'
import type { Container } from '@/container'

/**
 * Wire up the entire PACK/STICKER-PACK subsystem onto the bot. Called once from
 * the top-level `registerHandlers`. Order matters: conversations are installed
 * before the menus/commands that `enter` them, and the menu is installed before
 * the `/menu` command that sends it.
 */
export function registerPackHandlers(bot: Bot<MyContext, MyApi>, container: Container): void {
	const plugins = conversationPlugins(container)

	// 1) Conversations (v2). Side-effecting/DB work inside each goes through
	//    `conversation.external`; i18n/hydrate/deps are re-installed via `plugins`.
	bot.use(createConversation(createPackConversation, { id: 'pack-create', plugins }))
	bot.use(createConversation(editPackConversation, { id: 'pack-edit', plugins }))
	bot.use(createConversation(deletePackConversation, { id: 'pack-delete', plugins }))

	// 2) Menu tree (the submenus were registered onto `generalMenu` at module load).
	bot.use(generalMenu)

	// Entry point to open the menu. `/menu` is the natural owner of this layout;
	// if the general-handlers agent also binds it, grammY runs both harmlessly.
	bot.command('menu', async ctx => {
		await ctx.reply(ctx.t('menu-general'), {
			reply_markup: generalMenu,
			parse_mode: 'Markdown',
			link_preview_options: { is_disabled: true },
		})
	})

	// 3) Pack commands.
	bot.use(addElement)
	bot.use(editElement)
	bot.use(promote)
	bot.use(demote)
	bot.use(forceChatUpdate)
	bot.use(forceChatMemberUpdate)
}
