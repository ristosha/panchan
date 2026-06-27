import { Composer } from 'grammy'

import type { MyContext } from '@/bot/types/context'

import { awareScale } from './aware-scale'
import { balloon } from './balloon'
import { boom } from './boom'
import { demotivator } from './demotivator'
import { fisheye } from './fisheye'
import { stretch } from './stretch'
import { text } from './text'

export const generators = new Composer<MyContext>()

generators.use(demotivator)
generators.use(text)
generators.use(awareScale)
generators.use(balloon)
generators.use(stretch)
generators.use(fisheye)
generators.use(boom)
