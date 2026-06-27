import { Keyboard } from 'grammy'

import type { MyConversation, MyConversationContext } from '@/bot/types/context'

import { ownUserId } from './shared'

/**
 * "Delete pack" confirmation conversation. Entered with the pack id:
 * `ctx.conversation.enter('pack-delete', packId)`. Mirrors the legacy
 * `delete-pack` conversation.
 */
export async function deletePackConversation(
	conversation: MyConversation,
	ctx: MyConversationContext,
	packId: number,
): Promise<void> {
	const yesButton = ctx.t('conv-delete-pack-button.yes')
	const noButton = ctx.t('conv-delete-pack-button.no')

	const keyboard = new Keyboard().text(noButton).text(yesButton).resized().oneTime()
	const msg = await ctx.reply(ctx.t('conv-delete-pack', { id: packId }), { reply_markup: keyboard })

	const { message } = await conversation.waitFor('message:text')
	const data = message.text

	if (!data || (data !== yesButton && data !== noButton)) {
		await msg.delete().catch(() => {})
		await ctx.reply(ctx.t('conv-delete-pack.no-button-called'), {
			reply_markup: { remove_keyboard: true },
		})
		return
	}

	await msg.delete().catch(() => {})

	if (data === yesButton) {
		const userId = await ownUserId(conversation, ctx)
		if (userId != null) {
			await conversation.external(() => ctx.deps.repos.packs.deleteOwn(packId, userId))
		}
		await ctx.reply(ctx.t('conv-delete-pack.ok', { id: packId }), {
			reply_markup: { remove_keyboard: true },
		})
	} else {
		await ctx.reply(ctx.t('conv-delete-pack.cancelled', { id: packId }), {
			reply_markup: { remove_keyboard: true },
		})
	}
}
