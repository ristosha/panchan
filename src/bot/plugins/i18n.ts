import { I18n } from '@grammyjs/i18n'
import path from 'path'

import { type MyContext } from '~/bot/types/context.js'

export const i18n = new I18n<MyContext>({
  directory: path.resolve('resources/locales'),
  defaultLocale: 'ru',
  useSession: false,
  fluentBundleOptions: {
    useIsolating: false
  },
  localeNegotiator: async (ctx): Promise<string> => {
    return ctx.session.data.language ?? ctx.from?.language_code ?? 'ru'
  }
})
