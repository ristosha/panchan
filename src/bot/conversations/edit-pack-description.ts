import { Keyboard } from 'grammy'
import markdownEscape from 'markdown-escape'

import type { MyConversation, MyConversationContext } from '@/bot/types/context'

import { editPackNsfwStep } from './edit-pack-nsfw'

/**
 * Description step of the pack edit/create chain. Offers "leave empty" and, when a
 * description already exists, "keep as is".
 *
 * Deviation from the legacy code: the legacy conversation always wrote `null` for
 * the "keep" button too (so it silently cleared the description — a latent bug,
 * and the reason it pre-read the current description yet never used it). Here
 * "keep as is" skips the write entirely, which is the clearly intended behaviour.
 */
export async function editPackDescriptionStep(
	conversation: MyConversation,
	ctx: MyConversationContext,
	packId: number,
	userId: number,
): Promise<void> {
	const current = await conversation.external(() => ctx.deps.repos.packs.getDescription(packId))

	const remainButton = ctx.t('conv-create-pack-button.remain')
	const emptyButton = ctx.t('conv-create-pack-button.empty')

	const keyboard = new Keyboard().text(emptyButton)
	if (current?.description != null) keyboard.row().text(remainButton)
	keyboard.resized().oneTime()

	const msg = await ctx.reply(ctx.t('conv-create-pack.step-4'), { reply_markup: keyboard })

	const { message } = await conversation.waitFor('message:text')
	const data = message.text
	if (!data) {
		await msg.delete().catch(() => {})
		await ctx.reply(ctx.t('conv-create-pack.cancelled'), {
			reply_markup: { remove_keyboard: true },
		})
		return
	}

	if (data === remainButton) {
		// keep the existing description untouched
		await editPackNsfwStep(conversation, ctx, packId, userId)
		return
	}

	const description = data === emptyButton ? null : markdownEscape(data.substring(0, 300))
	await conversation.external(() =>
		ctx.deps.repos.packs.setDescription(packId, userId, description),
	)

	await editPackNsfwStep(conversation, ctx, packId, userId)
}
