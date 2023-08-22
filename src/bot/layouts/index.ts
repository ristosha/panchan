import { Composer } from 'grammy'

import { generalMenu } from '~/bot/layouts/general.js'
import { type MyContext } from '~/bot/types/context.js'

export const layouts = new Composer<MyContext>()

layouts.use(generalMenu.middleware())
