import { Canvas, loadImage } from '@napi-rs/canvas'

import type { GenerationContext } from '../context'
import { run } from '../exec'
import { multiline } from '../text/multiline'
import { demotivatorDefaults, parseTextOptions, type TextOptions } from '../text/options'
import { getVideoMetadata } from '../video'

export interface CreateDemotivatorParams {
	inputFile: string
	text: string
	watermark?: boolean
	circle?: boolean
	opts?: Partial<TextOptions> | Record<string, unknown>
}

export interface CreateDemotivatorVideoParams extends CreateDemotivatorParams {
	outputFile: string
	/** Pass to skip a redundant ffprobe when the duration is already known. */
	duration?: number
}

/** Classic "demotivator" black frame with a caption; returns a PNG buffer. */
export async function createDemotivatorImage(
	ctx: GenerationContext,
	params: CreateDemotivatorParams,
): Promise<Buffer> {
	const { resources } = ctx
	const { inputFile, text, watermark = true, circle = false, opts = {} } = params
	const { templates } = resources

	const image = await loadImage(inputFile)
	const { width, height } = templates.demotivator

	const canvas = new Canvas(width, height)
	const c = canvas.getContext('2d')
	c.drawImage(circle ? templates.circleDemotivator : templates.demotivator, 0, 0)
	c.drawImage(image, 29, 29, 380, 380)
	multiline(c, text, parseTextOptions(demotivatorDefaults, opts), resources.fallbackStack)
	if (watermark) {
		if (circle) c.drawImage(templates.circleDemotivatorWatermark, 273, 0)
		else c.drawImage(templates.demotivatorWatermark, 250, 8)
	}

	return canvas.encode('png')
}

/** Demotivator over a video: render the caption frame once, overlay on scaled video. */
export async function createDemotivatorVideo(
	ctx: GenerationContext,
	params: CreateDemotivatorVideoParams,
): Promise<void> {
	const { config, resources } = ctx
	const { inputFile, outputFile, text, watermark = true, circle = false, opts = {} } = params
	const { templates } = resources

	const duration = params.duration ?? (await getVideoMetadata(config, inputFile)).duration
	const { width, height } = templates.demotivator

	const canvas = new Canvas(width, height)
	const c = canvas.getContext('2d')
	c.drawImage(circle ? templates.circleDemotivator : templates.demotivator, 0, 0)
	multiline(c, text, parseTextOptions(demotivatorDefaults, opts), resources.fallbackStack)
	if (watermark) {
		if (circle) c.drawImage(templates.circleDemotivatorWatermark, 273, 0)
		else c.drawImage(templates.demotivatorWatermark, 250, 8)
	}

	const overlay = await canvas.encode('png')
	const args = [
		'-i',
		inputFile,
		'-i',
		'-',
		'-filter_complex',
		[
			`[0:v]scale=380:380,pad=${width}:${height}:29:29:black[v]`,
			'[v][1:v]overlay=0:0,setdar=436/512',
		].join(';'),
		'-threads',
		String(config.MEDIA_THREADS),
		'-c:v',
		'libx264',
		'-pix_fmt',
		'yuv420p',
		'-preset',
		'veryfast',
		'-crf',
		'24',
		'-f',
		'mp4',
		'-movflags',
		'frag_keyframe+empty_moov',
		'-loop',
		String(duration),
		'-map',
		'1:v',
		'-map',
		'0:a?',
		'-y',
		outputFile,
	]

	await run(config.FFMPEG, args, { input: overlay, timeoutMs: 30000 })
}
