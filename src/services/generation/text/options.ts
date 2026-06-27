import { z } from 'zod'

/**
 * Options for text rendering (text + demotivator generators).
 *
 * Properties are intentionally flat, not nested: the values originate from
 * user-typed command arguments and a flat shape keeps coercion simple.
 *
 * Ported from the legacy `znv`-based schema to plain `zod` (znv just re-exported
 * zod's `z`). The user-facing argument ALIAS parsing (the old `alias-mapper`
 * `composite.ts` / `key-value.ts`) is command-layer concern, not media
 * transformation, so it is intentionally NOT part of this pure engine.
 */
export const textOptionsSchema = z.object({
	xMax: z.coerce.number().default(-1),
	xMin: z.coerce.number().default(0),
	yMax: z.coerce.number().default(-1),
	yMin: z.coerce.number().default(0),
	verticalAlign: z.enum(['top', 'center', 'bottom']).default('bottom'),
	horizontalAlign: z.enum(['left', 'center', 'right']).default('center'),
	textAlign: z.enum(['left', 'center', 'right']).default('center'),
	fontSizeMax: z.coerce.number().default(60),
	fontSizeMin: z.coerce.number().default(10),
	fontStyle: z.string().default('times'),
	fontColor: z.string().default('black'),
	lineHeight: z.coerce.number().default(1),
	emojiStyle: z.string().default('apple'),
	marginTop: z.coerce.number().default(0),
	marginBottom: z.coerce.number().default(0),
	marginLeft: z.coerce.number().default(0),
	marginRight: z.coerce.number().default(0),
	maxLines: z.coerce.number().default(3),
	textWrap: z.coerce.boolean().default(true),
	strokeWidth: z.coerce.number().default(0),
	strokeStyle: z.string().default('black'),
	shadowColor: z.string().nullable().default('black'),
	shadowBlur: z.coerce.number().default(15),
	shadowOffsetX: z.coerce.number().default(0),
	shadowOffsetY: z.coerce.number().default(4),
})

export type TextOptions = z.infer<typeof textOptionsSchema>

export const textDefaults: TextOptions = {
	xMin: 0,
	xMax: -1,
	yMin: 0,
	yMax: -1,
	marginLeft: 10,
	marginTop: 10,
	marginRight: 10,
	marginBottom: 10,
	emojiStyle: 'apple',
	fontStyle: 'lobster',
	fontSizeMin: 10,
	fontSizeMax: -1,
	textWrap: true,
	fontColor: 'white',
	// effectively unlimited; must stay finite — zod 4 z.number() rejects Infinity
	maxLines: 100,
	textAlign: 'center',
	verticalAlign: 'bottom',
	horizontalAlign: 'center',
	lineHeight: 1.2,
	strokeStyle: 'black',
	strokeWidth: 0,
	shadowBlur: 15,
	shadowColor: 'black',
	shadowOffsetX: 0,
	shadowOffsetY: 4,
}

export const demotivatorDefaults: TextOptions = {
	xMax: 409, // 382 (content width) + 27 (black border)
	xMin: 27, // black border
	yMin: 409,
	yMax: 506, // max height - 6px padding
	fontSizeMin: 8,
	fontSizeMax: 65,
	fontColor: 'white',
	textAlign: 'center',
	verticalAlign: 'center',
	horizontalAlign: 'center',
	fontStyle: 'times',
	emojiStyle: 'apple',
	lineHeight: 1.1,
	marginRight: 0,
	marginTop: 0,
	marginLeft: 0,
	marginBottom: 0,
	textWrap: true,
	maxLines: 6,
	strokeWidth: 0,
	strokeStyle: 'black',
	shadowColor: null,
	shadowBlur: 0,
	shadowOffsetX: 0,
	shadowOffsetY: 0,
}

/**
 * Merge caller overrides onto a base default set and validate/coerce.
 * Mirrors the legacy `textOptions.parse({ ...defaults, ...opts })` pattern.
 */
export function parseTextOptions(
	base: TextOptions,
	opts: Partial<TextOptions> | Record<string, unknown> = {},
): TextOptions {
	return textOptionsSchema.parse({ ...base, ...opts })
}
