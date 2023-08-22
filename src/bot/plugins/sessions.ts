import { PrismaAdapter } from '@grammyjs/storage-prisma'
import { type Context, enhanceStorage, type Migrations, session } from 'grammy'

import { type MyContext } from '~/bot/types/context.js'
import { storage } from '~/storage.js'

export interface SessionData {
  data: {
    language?: string
    menu: any
  }
  conversation: any
}

const migrations: Migrations | undefined = undefined

const enhanced = enhanceStorage<SessionData['data']>({
  migrations,
  storage: new PrismaAdapter(storage.session)
})

function getSessionKey (ctx: Context) {
  return ctx.from?.id == null ? undefined : String(ctx.from.id)
}

export const sessions = session<SessionData, MyContext>({
  type: 'multi',
  data: {
    storage: enhanced,
    initial: () => ({ menu: {} }),
    getSessionKey
  },
  conversation: {}
})
