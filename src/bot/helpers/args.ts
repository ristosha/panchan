import type { MyContext } from '@/bot/types/context'

// ───────────────────────────────────────────────────────────────────────────
// Minimal in-house re-implementation of the legacy `alias-mapper` package
// (NOT a dependency in the rewrite). Two builders transform a flat parsed-args
// object: `composite` maps one user key to several option fields, `keyValue`
// maps an aliased key (+ optional value aliases) to a single canonical option.
// ───────────────────────────────────────────────────────────────────────────

export type ArgValue = string | number | boolean
export type ParsedArgs = Record<string, ArgValue> & { _: string }

const ARG_REGEX = /(?:^|\s)(-\S*)/gm

/** Split `"text -key=value -flag"` into `{ _: 'text', key: 'value', flag: true }`. */
export function parseArgs(input: string): ParsedArgs {
	const rawArgs = input.matchAll(ARG_REGEX)
	const text = input.replace(ARG_REGEX, '')
	const parsed: ParsedArgs = { _: text }

	for (const [, arg] of rawArgs) {
		const sliced = arg.slice(1)
		if (arg.includes('=')) {
			const [key, value] = sliced.split('=')
			parsed[key] = value
		} else {
			parsed[sliced] = true
		}
	}

	return parsed
}

// ── composite aliases ──

type ComputeFn = (value: ArgValue) => Record<string, unknown>

interface CompositeEntry {
	_aliases?: string[]
	_compute?: ComputeFn
	[field: string]: unknown
}

export type CompositeMap = Record<string, CompositeEntry>

function buildComposite(map: CompositeMap, args: Record<string, ArgValue>) {
	const result: Record<string, unknown> = { ...args }

	for (const [name, entry] of Object.entries(map)) {
		const names = [name, ...(entry._aliases ?? [])]
		const matched = names.find(n => n in result)
		if (matched == null) continue

		const value = result[matched] as ArgValue
		delete result[matched]

		if (typeof entry._compute === 'function') {
			Object.assign(result, entry._compute(value))
		} else {
			for (const [field, fieldValue] of Object.entries(entry)) {
				if (field === '_aliases' || field === '_compute') continue
				result[field] = fieldValue
			}
		}
	}

	return result
}

export function compositeAliases(map: CompositeMap) {
	return { build: (args: Record<string, ArgValue>) => buildComposite(map, args) }
}

// ── key-value aliases ──

interface KeyValueEntry {
	_aliases?: string[]
	_castTo?: 'number' | 'boolean'
	true?: string[]
	false?: string[]
	// canonical-value -> list of aliases for that value
	[canonicalValue: string]: string[] | string | undefined
}

export type KeyValueMap = Record<string, KeyValueEntry>

function buildKeyValue(map: KeyValueMap, args: Record<string, ArgValue>) {
	const result: Record<string, unknown> = { ...args }

	for (const [canonical, entry] of Object.entries(map)) {
		const names = [canonical, ...(entry._aliases ?? [])]
		const matched = names.find(n => n in result)
		if (matched == null) continue

		let value: unknown = result[matched]
		delete result[matched]

		if (entry._castTo === 'boolean') {
			const truthy = entry.true ?? []
			const falsy = entry.false ?? []
			if (value === true || truthy.includes(String(value))) value = true
			else if (falsy.includes(String(value))) value = false
			else value = Boolean(value)
		} else {
			for (const [canonicalValue, aliases] of Object.entries(entry)) {
				if (canonicalValue === '_aliases' || canonicalValue === '_castTo') continue
				if (
					Array.isArray(aliases) &&
					(canonicalValue === String(value) || aliases.includes(String(value)))
				) {
					value = canonicalValue
					break
				}
			}
			if (entry._castTo === 'number') value = Number(value)
		}

		result[canonical] = value
	}

	return result
}

export function keyValueAliases(map: KeyValueMap) {
	return { build: (args: Record<string, ArgValue>) => buildKeyValue(map, args) }
}

// ───────────────────────────── text option maps ─────────────────────────────
// Ported 1:1 from the legacy `src/api/schema/composite.ts` + `key-value.ts`.

const textCompositeMap: CompositeMap = {
	size: {
		_aliases: ['размер'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':').map(Number)
			let [min, max] = values
			if (values.length === 1) max = min
			return { fontSizeMax: max, fontSizeMin: min }
		},
	},
	lgbt: {
		_aliases: ['пидорасы', 'пидорас', 'rainbow'],
		fontColor: 'gradient(red,orange,yellow,green,blue,purple)',
		strokeWidth: 0,
	},
	border: {
		_aliases: ['stroke', 'обводка'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':')
			let [rawWidth, color] = values
			let width = Number(rawWidth)
			if (values.length === 1) {
				if (Number.isNaN(width)) width = 1
				color = 'black'
			}
			return { strokeWidth: width, strokeStyle: color }
		},
	},
	gradient: {
		_aliases: ['градиент'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const colors = value.split(':')
			return { fontColor: `gradient(${colors.join(',')})` }
		},
	},
	margin: {
		_aliases: ['m', 'отступ'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':').map(Number)
			let [marginTop, marginRight, marginBottom, marginLeft] = values
			if (values.length === 1) {
				marginRight = marginLeft = marginBottom = marginTop
			} else if (values.length === 2) {
				marginLeft = marginRight
				marginBottom = marginTop
			}
			return { marginTop, marginRight, marginBottom, marginLeft }
		},
	},
	shadow: {
		_aliases: ['sh', 'тень'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':')
			const [shadowColor, blur, offsetX, offsetY] = values
			const shadowBlur = Number(blur)
			const shadowOffsetX = Number(offsetX)
			const shadowOffsetY = Number(offsetY)
			if (values.length === 1) return { shadowColor }
			if (values.length === 2) return { shadowColor, shadowBlur }
			if (values.length === 3 && !Number.isNaN(shadowOffsetX)) {
				return { shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY: shadowOffsetX }
			}
			if (values.length === 4 && !Number.isNaN(shadowOffsetX) && !Number.isNaN(shadowOffsetY)) {
				return { shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY }
			}
			return { shadowColor, shadowBlur }
		},
	},
	'bottom-left': {
		_aliases: ['низ-лево', 'нижній-лівий'],
		verticalAlign: 'bottom',
		horizontalAlign: 'left',
	},
	'bottom-center': {
		_aliases: ['низ-центр', 'нижній-центр'],
		verticalAlign: 'bottom',
		horizontalAlign: 'center',
	},
	'bottom-right': {
		_aliases: ['низ-право', 'нижній-правий'],
		verticalAlign: 'bottom',
		horizontalAlign: 'right',
	},
	'center-left': {
		_aliases: ['центр-лево', 'центр-лівий'],
		verticalAlign: 'center',
		horizontalAlign: 'left',
	},
	'center-center': {
		_aliases: ['центр-центр', 'центр'],
		verticalAlign: 'center',
		horizontalAlign: 'center',
	},
	'center-right': {
		_aliases: ['центр-право', 'центр-правий'],
		verticalAlign: 'center',
		horizontalAlign: 'right',
	},
	'top-left': {
		_aliases: ['верх-лево', 'верхній-лівий'],
		verticalAlign: 'top',
		horizontalAlign: 'left',
	},
	'top-center': {
		_aliases: ['верх-центр', 'верхній-центр'],
		verticalAlign: 'top',
		horizontalAlign: 'center',
	},
	'top-right': {
		_aliases: ['верх-право', 'верхній-правий'],
		verticalAlign: 'top',
		horizontalAlign: 'right',
	},
}

const textParamsMap: KeyValueMap = {
	xMax: { _aliases: ['x-maximum', 'x-max', 'xmax', 'икс-максимум', 'икс-макс'], _castTo: 'number' },
	xMin: { _aliases: ['x-minimum', 'x-min', 'xmin', 'икс-минимум', 'икс-мин'], _castTo: 'number' },
	yMax: {
		_aliases: ['y-maximum', 'y-max', 'ymax', 'игрек-максимум', 'игрек-макс'],
		_castTo: 'number',
	},
	yMin: {
		_aliases: ['y-minimum', 'y-min', 'ymin', 'игрек-минимум', 'игрек-мин'],
		_castTo: 'number',
	},
	fontSizeMax: {
		_aliases: ['fontsize-maximum', 'fs-max', 'fsmax', 'макс-размер', 'максраз'],
		_castTo: 'number',
	},
	fontSizeMin: {
		_aliases: ['fontsize-minimum', 'fs-min', 'fsmin', 'мин-размер', 'минраз'],
		_castTo: 'number',
	},
	lineHeight: {
		_aliases: [
			'fontheight',
			'font-height',
			'fh',
			'line-height',
			'lineheight',
			'lh',
			'высота-строки',
			'высстр',
		],
		_castTo: 'number',
	},
	emojiStyle: { _aliases: ['emoji'] },
	textWrap: {
		_aliases: ['fit', 'подгонка', 'подгон', 'переносить'],
		_castTo: 'boolean',
		true: ['yes', 'on', 'да', 't', 'y'],
		false: ['no', 'off', 'нет', 'f', 'n'],
	},
	fontStyle: {
		_aliases: ['font', 'шрифт', 'f'],
		lobster: ['лосбтер', 'краб'],
		times: ['times-new-roman', 'таймс'],
		arial: ['ариал', 'эриал'],
	},
	verticalAlign: {
		_aliases: ['vertical-align', 'v-align', 'valign', 'va', 'по-вертикали'],
		top: ['t', 'up', 'верх', 'вверх', 'в'],
		center: ['middle', 'mid', 'm', 'cen', 'c', 'середина', 'с', 'центр', 'ц'],
		bottom: ['b', 'down', 'низ', 'вниз', 'жопа'],
	},
	horizontalAlign: {
		_aliases: ['horizontal-align', 'h-align', 'halign', 'ha', 'по-горизонтали'],
		left: ['l', 'по-левому-краю', 'влево', 'лево', 'л'],
		center: ['middle', 'mid', 'm', 'cen', 'c', 'середина', 'с', 'центр', 'ц'],
		right: ['r', 'право', 'вправо', 'п'],
	},
	textAlign: {
		_aliases: [
			'font-align',
			'text-align',
			'f-align',
			't-align',
			'talign',
			'falign',
			'align',
			'выравнивание',
			'выравн',
		],
		left: ['l', 'по-левому-краю', 'влево', 'лево', 'л'],
		center: ['middle', 'mid', 'm', 'cen', 'c', 'по-середине', 'середина', 'с', 'центр', 'ц'],
		right: ['r', 'по-правому-краю', 'вправо', 'право', 'п'],
	},
	fontColor: {
		_aliases: ['color', 'c', 'цвет', 'ц'],
		white: ['белый', 'бел'],
		black: ['чёрный', 'черный', 'черн'],
		gray: ['серый', 'сер'],
		red: ['красный', 'красн'],
		blue: ['синий', 'син'],
		green: ['зелёный', 'зеленый', 'зел'],
		pink: ['розовый', 'роз'],
		violet: ['фиолетовый', 'фиолет'],
		orange: ['оранжевый', 'оранж', 'апельсин', 'мандарин'],
	},
}

export const textComposite = compositeAliases(textCompositeMap)
export const textParams = keyValueAliases(textParamsMap)

export const resizeComposite = compositeAliases({
	size: {
		_aliases: ['resize', 'размер'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':').map(Number)
			let [width, height] = values
			if (values.length === 1) height = width
			return { resize: { width, height } }
		},
	},
	scale: {
		_aliases: ['scale', 'масштаб'],
		_compute: value => {
			if (typeof value !== 'string') return {}
			const values = value.split(':').map(Number)
			let [width, height] = values
			if (values.length === 1) height = width
			return { scale: { width, height } }
		},
	},
})

/**
 * Resolve the raw argument string for the current update: command match first,
 * else message text / caption. Then run it through the composite + key-value
 * alias builders (text generators) by default.
 */
export function parseArgsInMessage(
	ctx: MyContext,
	opts: {
		composite?: ReturnType<typeof compositeAliases>
		keyValue?: ReturnType<typeof keyValueAliases>
	} = {},
) {
	const { composite = textComposite, keyValue = textParams } = opts

	const text =
		ctx.match != null
			? typeof ctx.match === 'string'
				? ctx.match
				: (ctx.match.at(-1) ?? '')
			: (ctx.msg?.text ?? ctx.msg?.caption ?? '')

	let args: Record<string, ArgValue> = parseArgs(text ?? '')
	if (composite != null) args = composite.build(args) as Record<string, ArgValue>
	if (keyValue != null) args = keyValue.build(args) as Record<string, ArgValue>

	return args as ParsedArgs
}
