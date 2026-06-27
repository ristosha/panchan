import { Canvas, loadImage } from '@napi-rs/canvas'

import type { GenerationContext } from '../context'
import { run } from '../exec'
import { multiline } from '../text/multiline'
import { parseTextOptions, type TextOptions, textDefaults } from '../text/options'
import { nearestEven } from '../utils'
import { getVideoMetadata } from '../video'
import { getOppositeCorner, transparentWatermark } from '../watermark'

export interface CreateTextImageParams {
	inputFile: string
	text: string
	watermark?: boolean
	opts?: Partial<TextOptions> | Record<string, unknown>
}

export interface CreateTextVideoParams extends CreateTextImageParams {
	outputFile: string
	/** Pass to skip a redundant ffprobe when Telegram already gave us the dims. */
	meta?: { width: number; height: number; duration: number }
}

/** Draw a caption (with auto-fit/wrap) over an image; returns a PNG buffer. */
export async function createTextImage(
	ctx: GenerationContext,
	params: CreateTextImageParams,
): Promise<Buffer> {
	const { resources } = ctx
	const { inputFile, text, watermark = true, opts = {} } = params

	const image = await loadImage(inputFile)
	const { width, height } = image

	const canvas = new Canvas(width, height)
	const c = canvas.getContext('2d')
	const options = parseTextOptions(textDefaults, opts)

	c.drawImage(image, 0, 0)
	multiline(c, text, options, resources.fallbackStack)
	transparentWatermark({ image: resources.templates.watermark, ctx: c, width, height, watermark })

	return canvas.encode('png')
}

/**
 * Draw a caption over a video. The text layer is rendered once to a canvas and
 * overlaid on the scaled video via ffmpeg.
 */
export async function createTextVideo(
	ctx: GenerationContext,
	params: CreateTextVideoParams,
	format: 'webm' | 'mp4' = 'mp4',
): Promise<void> {
	const { config, resources } = ctx
	const { inputFile, outputFile, text, meta, watermark = true, opts = {} } = params

	let { width, height, duration } = meta ?? (await getVideoMetadata(config, inputFile))

	if (height <= width) {
		const oldWidth = width
		width = 512
		height = nearestEven(Math.round((height / oldWidth) * width))
	} else {
		const oldHeight = height
		height = 512
		width = nearestEven(Math.round((width / oldHeight) * height))
	}

	const canvas = new Canvas(width, height)
	const c = canvas.getContext('2d')
	const options = parseTextOptions(textDefaults, opts)

	multiline(c, text, options, resources.fallbackStack)
	transparentWatermark({
		image: resources.templates.watermark,
		watermark,
		width,
		height,
		...getOppositeCorner(options),
	})

	const args = [
		'-i',
		inputFile, // video stream
		'-i',
		'-', // canvas (text) stream
		'-y',
		// single `-threads` (legacy had a stray duplicate `-threads 4` here)
		'-threads',
		String(config.MEDIA_THREADS),
		'-filter_complex',
		`[0:v]scale=${width}:${height}[v];[v][1:v]overlay=0:0`,
		...(format === 'webm'
			? ['-c:v', 'libvpx', '-f', 'webm']
			: ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-f', 'mp4']),
		'-pix_fmt',
		'yuv420p',
		'-movflags',
		'frag_keyframe+empty_moov',
		'-loop',
		String(duration),
		'-map',
		'1:v',
		'-map',
		'0:a?',
		'-c:a',
		'copy',
		'-an',
		outputFile,
	]

	await run(config.FFMPEG, args, { input: await canvas.encode('png'), timeoutMs: 45000 })
}
