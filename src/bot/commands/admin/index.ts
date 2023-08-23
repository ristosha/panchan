import { Composer } from 'grammy'

import { addAsJson } from '~/bot/commands/admin/add-as-json.js'
import { autoUploader } from '~/bot/commands/admin/auto-uploader.js'
import { premium } from '~/bot/commands/admin/premium.js'
import { setDefault } from '~/bot/commands/admin/set-default.js'
import { stats } from '~/bot/commands/admin/stats.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export const admin = new Composer<MyContext>()
const onlyAdmin = admin.filter(c => c.from?.id === config.BOT_ADMIN_ID)

onlyAdmin.use(premium)
onlyAdmin.use(stats)

// utils
onlyAdmin.use(autoUploader)
onlyAdmin.use(setDefault)
onlyAdmin.use(addAsJson)
