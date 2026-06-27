import { resolve } from 'node:path'
import { I18n } from '@grammyjs/i18n'

import type { MyContext } from '@/bot/types/context'

// Negotiates from the Telegram client language only — NOT from the session, so
// ordinary updates never trigger a session read (the legacy negotiator forced a
// session fetch on every update). Default RU.
export const i18n = new I18n<MyContext>({
	directory: resolve('resources/locales'),
	defaultLocale: 'ru',
	useSession: false,
	fluentBundleOptions: { useIsolating: false },
	localeNegotiator: ctx => ctx.from?.language_code ?? 'ru',
})
