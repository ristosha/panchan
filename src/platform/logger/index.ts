import { type Logger as PinoLogger, pino } from 'pino'

export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const
export const LOG_FORMATS = ['json', 'text'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]
export type LogFormat = (typeof LOG_FORMATS)[number]

export interface Logger {
	trace(obj: unknown, msg?: string): void
	debug(obj: unknown, msg?: string): void
	info(obj: unknown, msg?: string): void
	warn(obj: unknown, msg?: string): void
	error(obj: unknown, msg?: string): void
	fatal(obj: unknown, msg?: string): void
	named(name: string): Logger
	isLevelEnabled(level: LogLevel): boolean
}

export function createLogger(opts: { level: LogLevel; format: LogFormat }): Logger {
	const base = pino({
		level: opts.level,
		...(opts.format === 'text'
			? {
					transport: {
						target: 'pino-pretty',
						options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname' },
					},
				}
			: {}),
	})

	const wrap = (l: PinoLogger): Logger => ({
		trace: (o, m) => l.trace(o as object, m),
		debug: (o, m) => l.debug(o as object, m),
		info: (o, m) => l.info(o as object, m),
		warn: (o, m) => l.warn(o as object, m),
		error: (o, m) => l.error(o as object, m),
		fatal: (o, m) => l.fatal(o as object, m),
		named: name => wrap(l.child({ name })),
		isLevelEnabled: level => level !== 'silent' && l.isLevelEnabled(level),
	})

	return wrap(base)
}
