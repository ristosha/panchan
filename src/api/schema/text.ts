import { z } from 'znv'

/**
 * This schema defines the options for a component.
 * The properties are not nested because the data is based on user input.
 * Using nested properties would make the code more difficult and complex.
 */
export const textOptions = z.object({
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
  strokeStyle: z.string().default('black')
})

type TextOptionsInferred = z.infer<typeof textOptions>

// fix autocomplete
export type TextOptions = TextOptionsInferred & {
  verticalAlign: 'top' | 'center' | 'bottom'
  horizontalAlign: 'left' | 'center' | 'right'
  textAlign: 'left' | 'center' | 'right'
}

export { textComposite } from '~/api/schema/composite.js'
export { textParams } from '~/api/schema/key-value.js'
