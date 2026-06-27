import { Keyboard } from 'grammy'

import type { MyConversation, MyConversationContext } from '@/bot/types/context'

/**
 * Final step of the pack edit/create chain: NSFW flag (stored as the `nsfw` tag).
 * Mirrors the legacy `edit-pack-nsfw` conversation. `packId`/`userId` are threaded
 * in from the previous step rather than read from session.
 */
export async function editPackNsfwStep(
	conversation: MyConversation,
	ctx: MyConversationContext,
	packId: number,
	userId: number,
): Promise<void> {
	const yesButton = ctx.t('conv-create-pack-button.yes')
	const noButton = ctx.t('conv-create-pack-button.no')

	const keyboard = new Keyboard().text(yesButton).text(noButton).resized().oneTime()
	const msg = await ctx.reply(ctx.t('conv-create-pack.step-5'), { reply_markup: keyboard })

	const { message } = await conversation.waitFor('message:text')
	const data = message.text
	if (!data) {
		await msg.delete().catch(() => {})
		await ctx.reply(ctx.t('conv-create-pack.cancelled'), {
			reply_markup: { remove_keyboard: true },
		})
		return
	}

	const nsfw = data === yesButton
	await conversation.external(() =>
		ctx.deps.repos.packs.setTags(packId, userId, nsfw ? ['nsfw'] : []),
	)

	await msg.delete().catch(() => {})
	await ctx.reply(ctx.t('conv-create-pack.ok'), { reply_markup: { remove_keyboard: true } })
}
