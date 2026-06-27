import { InlineKeyboard } from 'grammy'
import markdownEscape from 'markdown-escape'

import type { MyConversation, MyConversationContext } from '@/bot/types/context'

import { editPackPrivacyStep } from './edit-pack-privacy'
import { ownUserId } from './shared'

/**
 * "Create pack" conversation. Steps 1-2 here (type + name); the remaining steps
 * (privacy/description/nsfw) are shared with the standalone edit flow. Mirrors the
 * legacy `create-pack` conversation, ported to conversations v2.
 */
export async function createPackConversation(
	conversation: MyConversation,
	ctx: MyConversationContext,
): Promise<void> {
	// Step 1 — pack type (inline keyboard)
	const step1Kb = new InlineKeyboard()
		.text(ctx.t('media-pack'), 'cp/media')
		.text(ctx.t('title-pack'), 'cp/title')
		.row()
		.text(ctx.t('conv-create-pack-button.cancel'), 'cp/cancel')

	const step1 = await ctx.reply(ctx.t('conv-create-pack.step-1'), { reply_markup: step1Kb })

	const cbCtx = await conversation.waitForCallbackQuery(/^cp\/.+/)
	const choice = cbCtx.callbackQuery.data.split('/')[1]
	await cbCtx.answerCallbackQuery().catch(() => {})
	await step1.delete().catch(() => {})

	if (choice === 'cancel') {
		await ctx.reply(ctx.t('conv-create-pack.cancelled'))
		return
	}
	const packType = choice === 'media' ? 'MEDIA' : 'TITLES'

	// Step 2 — name
	const step2 = await ctx.reply(ctx.t('conv-create-pack.step-2'))
	const { message } = await conversation.waitFor('message:text')
	const nameText = message.text
	await step2.delete().catch(() => {})
	if (!nameText) {
		await ctx.reply(ctx.t('conv-create-pack.cancelled'))
		return
	}
	const name = markdownEscape(nameText.substring(0, 32))

	const userId = await ownUserId(conversation, ctx)
	if (userId == null) {
		await ctx.reply(ctx.t('conv-create-pack.cancelled'))
		return
	}

	const pack = await conversation.external(() =>
		ctx.deps.repos.packs.create({ name, type: packType, authorId: userId }),
	)

	// Continue into privacy -> description -> nsfw on the freshly created pack.
	await editPackPrivacyStep(conversation, ctx, pack.id, userId)
}
