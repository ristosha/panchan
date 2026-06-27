import { Keyboard } from 'grammy'

import type { MyConversation, MyConversationContext } from '@/bot/types/context'

import { editPackDescriptionStep } from './edit-pack-description'
import { ownUserId } from './shared'

/**
 * Privacy step of the pack edit/create chain (private vs public), then chains into
 * description -> nsfw. Mirrors the legacy `edit-pack-privacy` conversation.
 */
export async function editPackPrivacyStep(
	conversation: MyConversation,
	ctx: MyConversationContext,
	packId: number,
	userId: number,
): Promise<void> {
	const privateButton = ctx.t('conv-create-pack-button.private')
	const publicButton = ctx.t('conv-create-pack-button.public')

	const keyboard = new Keyboard().text(privateButton).text(publicButton).resized().oneTime()
	const msg = await ctx.reply(ctx.t('conv-create-pack.step-3'), { reply_markup: keyboard })

	const { message } = await conversation.waitFor('message:text')
	const data = message.text
	if (!data) {
		await msg.delete().catch(() => {})
		await ctx.reply(ctx.t('conv-create-pack.cancelled'), {
			reply_markup: { remove_keyboard: true },
		})
		return
	}

	const isPrivate = data === privateButton
	await conversation.external(() => ctx.deps.repos.packs.setPrivacy(packId, userId, isPrivate))

	await editPackDescriptionStep(conversation, ctx, packId, userId)
}

/**
 * Standalone "Edit pack" conversation (entered from the pack menu's edit button).
 * Runs the full privacy -> description -> nsfw chain on an existing pack. The pack
 * id is passed as an argument to `ctx.conversation.enter('pack-edit', packId)`.
 */
export async function editPackConversation(
	conversation: MyConversation,
	ctx: MyConversationContext,
	packId: number,
): Promise<void> {
	const userId = await ownUserId(conversation, ctx)
	if (userId == null) {
		await ctx.reply(ctx.t('conv-create-pack.cancelled'))
		return
	}
	await editPackPrivacyStep(conversation, ctx, packId, userId)
}
