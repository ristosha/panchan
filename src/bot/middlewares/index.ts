import { Composer } from 'grammy'

import { captionFix } from '~/bot/middlewares/caption-fix.js'
import { handleSearch } from '~/bot/middlewares/handle-search.js'
import { handleUsage } from '~/bot/middlewares/handle-usage.js'
import { memberUpdate } from '~/bot/middlewares/member-update.js'
import { nonEnglishCommands } from '~/bot/middlewares/non-english-commands.js'
import { replyMediaMerge } from '~/bot/middlewares/reply-media-merge.js'
import { setChannel } from '~/bot/middlewares/set-channel.js'
import { setChat } from '~/bot/middlewares/set-chat.js'
import { setChatMember } from '~/bot/middlewares/set-chat-member.js'
import { setUser } from '~/bot/middlewares/set-user.js'
import { type MyContext } from '~/bot/types/context.js'

export const middlewares = new Composer<MyContext>()
export const stateMiddlewares = new Composer<MyContext>()
stateMiddlewares.use(setUser)
stateMiddlewares.use(setChat)
stateMiddlewares.use(setChatMember)
stateMiddlewares.use(setChannel)

middlewares.use(stateMiddlewares)
// middlewares.use(autoChatAction())
// middlewares
middlewares.use(captionFix)
middlewares.use(memberUpdate)
middlewares.use(handleUsage)
middlewares.use(replyMediaMerge)
middlewares.use(nonEnglishCommands)
middlewares.use(handleSearch)
