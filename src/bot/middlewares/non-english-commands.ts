import type { MiddlewareFn } from 'grammy'
import type { MessageEntity } from 'grammy/types'

import type { MyContext } from '@/bot/types/context'

/**
 * Telegram only tags `/command` as a `bot_command` entity for ASCII command
 * names. Cyrillic command aliases (e.g. `/лобстер`) arrive without the entity,
 * so `bot.command()` never matches. This synthesises the entity for any message
 * that starts with `/`, honouring an explicit `@botusername` suffix.
 */
export const nonEnglishCommands: MiddlewareFn<MyContext> = async (ctx, next) => {
	const msg = ctx.msg
	if (msg?.text == null) {
		await next()
		return
	}

	const text = msg.text
	let entities: MessageEntity[] | undefined = msg.entities

	if (text.startsWith('/')) {
		if (entities == null || entities.some(e => e.type === 'bot_command')) {
			let [commandName] = text.split(' ')
			if (commandName.includes('@')) {
				const [name, botRelated] = commandName.split('@')
				commandName = name
				if (botRelated !== ctx.me.username) return
			}

			entities ??= []
			;(msg as { entities?: MessageEntity[] }).entities = [
				...entities,
				{ type: 'bot_command', length: commandName.length, offset: 0 },
			]
		}
	}

	await next()
}
