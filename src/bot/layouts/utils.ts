import { createBackMainMenuButtons } from 'grammy-inline-menu'

import { type MyContext } from '~/bot/types/context.js'

export const backButtons = createBackMainMenuButtons<MyContext>(
  ctx => ctx.t('back-button'),
  ctx => ctx.t('general-menu-button')
)
