import { Composer } from 'grammy'

import { premium } from '~/bot/commands/admin/premium.js'
import { stats } from '~/bot/commands/admin/stats.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export const admin = new Composer<MyContext>()
const onlyAdmin = admin.filter(c => c.from?.id === config.BOT_ADMIN_ID)

onlyAdmin.use(premium)
onlyAdmin.use(stats)
