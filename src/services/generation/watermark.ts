import { Canvas, type Image, type SKRSContext2D } from '@napi-rs/canvas'

export type VerticalAlign = 'bottom' | 'center' | 'top'
export type HorizontalAlign = 'left' | 'center' | 'right'

export interface WatermarkParams {
	/** The watermark PNG (from `resources.templates.watermark`). */
	image: Image
	width: number
	height: number
	ctx?: SKRSContext2D
	watermark?: boolean
	verticalAlign?: VerticalAlign
	horizontalAlign?: HorizontalAlign
}

/**
 * Draw the semi-transparent watermark onto (a copy of) a canvas and return it.
 *
 * When `watermark === false` (premium users) this is a no-op that returns the
 * untouched canvas. Callers that build a dedicated ffmpeg overlay layer must
 * ALSO skip the extra ffmpeg input + overlay filter in that case — see the
 * spherical/boom generators.
 */
export function transparentWatermark(params: WatermarkParams): Canvas {
	const {
		image,
		width,
		height,
		watermark = true,
		ctx = new Canvas(width, height).getContext('2d'),
		verticalAlign = 'bottom',
		horizontalAlign = 'right',
	} = params

	if (!watermark) return ctx.canvas

	const watermarkWidth = image.width
	const watermarkHeight = image.height

	let x = 0
	let y = height - watermarkHeight

	if (horizontalAlign === 'center') {
		x = (width - watermarkWidth) / 2
	} else if (horizontalAlign === 'right') {
		x = width - watermarkWidth
	}
	if (verticalAlign === 'center') {
		y = (height - watermarkHeight) / 2
	} else if (verticalAlign === 'top') {
		y = 0
	}

	ctx.drawImage(image, x, y)
	return ctx.canvas
}

export function getOppositeCorner(options: {
	verticalAlign?: VerticalAlign
	horizontalAlign?: HorizontalAlign
}): { verticalAlign: VerticalAlign; horizontalAlign: HorizontalAlign } {
	const horizontalAlign: HorizontalAlign = options.horizontalAlign === 'left' ? 'right' : 'left'
	const verticalAlign: VerticalAlign =
		options.verticalAlign === 'top'
			? 'bottom'
			: options.verticalAlign === 'bottom'
				? 'top'
				: 'bottom'
	return { horizontalAlign, verticalAlign }
}
