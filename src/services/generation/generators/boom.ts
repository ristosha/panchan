import { join } from 'node:path'
import { loadImage } from '@napi-rs/canvas'

import type { GenerationContext } from '../context'
import { run } from '../exec'
import { getVideoMetadata } from '../video'
import { transparentWatermark } from '../watermark'

const verticalTemplates = ['1-vertical', '2-vertical', '3-vertical']
const horizontalTemplates = ['1-horizontal', '2-horizontal', '3-horizontal']
const squareTemplates = ['1-square', '2-square', '3-square']

export const templates = [...verticalTemplates, ...horizontalTemplates, ...squareTemplates]

export function chooseRandomTemplate(width: number, height: number): string {
	const ratio = width / height
	let pool: string[]
	if (ratio > 1.3) {
		pool = horizontalTemplates
	} else if (ratio < 0.7) {
		pool = verticalTemplates
	} else {
		pool = squareTemplates
	}
	return pool[Math.floor(Math.random() * pool.length)]
}

export interface BoomParams {
	inputFile: string
	outputFile: string
	template?: string
	watermark?: boolean
	meta?: { width: number; height: number; hasAudio?: boolean }
}

const ENCODE = [
	'-threads',
	'__THREADS__',
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
]

function encodeFlags(threads: number): string[] {
	return ENCODE.map(a => (a === '__THREADS__' ? String(threads) : a))
}

/** Image "boom": loop the still image then play a boom template clip after it. */
export async function boomImage(ctx: GenerationContext, params: BoomParams): Promise<void> {
	const { config, resources } = ctx
	let { template } = params
	const { inputFile, outputFile, watermark = true } = params

	const meta = params.meta ?? (await loadImage(inputFile))
	const { width, height } = meta
	if (template == null || !templates.includes(template)) {
		template = chooseRandomTemplate(width, height)
	}

	// the still image needs an explicit duration/fps, else ffmpeg has a single
	// frame with no timebase and the concat stalls (loop filter hung → timeout).
	const inputs = [
		'-loop',
		'1',
		'-framerate',
		'30',
		'-t',
		'3',
		'-i',
		inputFile,
		'-i',
		join(resources.boomFolder, `${template}.mp4`),
	]
	const filter = [
		'[1:v][0:v]scale2ref[boom][media]',
		'[media]setsar=1[media]',
		'[boom]setsar=1[boom]',
		'[media][boom]concat=n=2:v=1:a=0[v]',
	]
	let mapLabel = '[v]'
	let input: Uint8Array | undefined

	if (watermark) {
		const wm = transparentWatermark({
			image: resources.templates.watermark,
			width,
			height,
			watermark: true,
		})
		input = await wm.encode('png')
		inputs.push('-i', '-')
		filter.push('[v][2:v]overlay=0:0[v2]')
		mapLabel = '[v2]'
	}

	const args = [
		...inputs,
		'-filter_complex',
		filter.join(';'),
		...encodeFlags(config.MEDIA_THREADS),
		'-map',
		mapLabel,
		'-y',
		outputFile,
	]

	await run(config.FFMPEG, args, { input, timeoutMs: 30000 })
}

/** Video "boom": play the media, then a boom template clip, concatenated. */
export async function boomVideo(ctx: GenerationContext, params: BoomParams): Promise<void> {
	const { config, resources } = ctx
	let { template } = params
	const { inputFile, outputFile, watermark = true } = params

	const meta = params.meta ?? (await getVideoMetadata(config, inputFile))
	const { width, height } = meta
	const hasAudio = meta.hasAudio ?? false
	if (template == null || !templates.includes(template)) {
		template = chooseRandomTemplate(width, height)
	}

	const inputs = ['-i', inputFile, '-i', join(resources.boomFolder, `${template}.mp4`)]
	const filter = [
		'[1:v][0:v]scale2ref[boom][media]',
		'[media]setsar=1[media]',
		'[boom]setsar=1[boom]',
		hasAudio
			? '[media][0:a][boom][1:a]concat=n=2:v=1:a=1[v][a]'
			: '[media][boom]concat=n=2:v=1:a=0[v]',
	]
	let mapLabel = '[v]'
	let input: Uint8Array | undefined

	if (watermark) {
		const wm = transparentWatermark({
			image: resources.templates.watermark,
			width,
			height,
			watermark: true,
		})
		input = await wm.encode('png')
		inputs.push('-i', '-')
		filter.push('[v][2:v]overlay=0:0[v2]')
		mapLabel = '[v2]'
	}

	const args = [
		...inputs,
		'-filter_complex',
		filter.join(';'),
		'-map',
		mapLabel,
		...(hasAudio ? ['-map', '[a]'] : []),
		...encodeFlags(config.MEDIA_THREADS),
		'-y',
		outputFile,
	]

	await run(config.FFMPEG, args, { input, timeoutMs: 30000 })
}
