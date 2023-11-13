import { Composer } from 'grammy'

import { addElement } from '~/bot/commands/add-element.js'
import { admin } from '~/bot/commands/admin/index.js'
import { demote } from '~/bot/commands/demote.js'
import { edit } from '~/bot/commands/edit.js'
import { editElement } from '~/bot/commands/edit-element.js'
import { forceChatMemberUpdate } from '~/bot/commands/force-chat-member-update.js'
import { forceChatUpdate } from '~/bot/commands/force-chat-update.js'
import { generators } from '~/bot/commands/generators/index.js'
import { menu } from '~/bot/commands/menu.js'
import { orig } from '~/bot/commands/orig.js'
import { promote } from '~/bot/commands/promote.js'
import { randomDemotivator } from '~/bot/commands/random-demotivator.js'
import { randomLobster } from '~/bot/commands/random-lobster.js'
import { reroll } from '~/bot/commands/reroll.js'
import { reset } from '~/bot/commands/reset.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export const commands = new Composer<MyContext>()

commands.use(menu)
commands.use(generators)

commands.use(randomDemotivator)
commands.use(randomLobster)

commands.use(orig)
commands.use(edit)
commands.use(reroll)

commands.use(addElement)
commands.use(editElement)

commands.use(promote)
commands.use(demote)

commands.use(reset)
commands.use(forceChatUpdate)
commands.use(forceChatMemberUpdate)

if (config.BOT_ADMIN_ID != null) {
  commands.use(admin)
}
