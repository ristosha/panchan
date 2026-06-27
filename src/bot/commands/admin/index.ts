import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { addAsJson } from './add-as-json'
import { autoUploader } from './auto-uploader'
import { premium } from './premium'
import { setDefault } from './set-default'
import { stats } from './stats'

/** Admin-only command surface, gated by `config.isAdmin(ctx.from.id)`. */
export const admin = new Composer<MyContext>()

const onlyAdmin = admin.filter(ctx => ctx.from != null && ctx.deps.config.isAdmin(ctx.from.id))

onlyAdmin.use(premium)
onlyAdmin.use(stats)
onlyAdmin.use(autoUploader)
onlyAdmin.use(setDefault)
onlyAdmin.use(addAsJson)
