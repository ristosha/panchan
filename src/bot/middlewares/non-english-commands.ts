import { type NextFunction } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'

export async function nonEnglishCommands (ctx: MyContext, next: NextFunction) {
  if (ctx.msg == null || ctx.msg.text == null) {
    await next()
    return
  }

  let { text, entities: ents } = ctx.msg
  if (text.startsWith('/')) {
    // message is started as command, but not parsed
    if (ents == null || ents.filter(x => x.type === 'bot_command').length > 0) {
      let [commandName] = text.split(' ')
      if (commandName.includes('@')) {
        let botRelated: string
        [commandName, botRelated] = commandName.split('@')
        if (botRelated !== ctx.me.username) return
      }

      if (ents == null) ents = []
      ctx.msg.entities = [...ents, {
        type: 'bot_command',
        length: commandName.length,
        offset: 0
      }]
    }
  }

  await next()
}
