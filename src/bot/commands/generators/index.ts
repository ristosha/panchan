import { Composer } from 'grammy'

import { awareScale } from '~/bot/commands/generators/aware-scale.js'
import { balloon } from '~/bot/commands/generators/balloon.js'
import { demotivator } from '~/bot/commands/generators/demotivator.js'
import { fisheye } from '~/bot/commands/generators/fisheye.js'
import { stretch } from '~/bot/commands/generators/stretch.js'
import { text } from '~/bot/commands/generators/text.js'
import { type MyContext } from '~/bot/types/context.js'

export const generators = new Composer<MyContext>()

generators.use(demotivator)
generators.use(text)
generators.use(awareScale)
generators.use(balloon)
generators.use(stretch)
generators.use(fisheye)
