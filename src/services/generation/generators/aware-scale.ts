import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Canvas, loadImage } from '@napi-rs/canvas'

import type { GenerationContext } from '../context'
import { TooManyFrames } from '../errors'
import { run } from '../exec'
import { MAGICK_LIMITS } from '../image'
import type { Loader } from '../loader'
import { chunk, nearestEven } from '../utils'
import { extractFrames, getVideoMetadata } from '../video'
import { transparentWatermark } from '../watermark'

export interface AwareScaleParams {
	inputFile: string
	outputFile: string
	watermark?: boolean
	scale?: { width: number; height: number }
	resize?: { width: number; height: number }
}

export interface AwareScaleVideoParams extends AwareScaleParams {
	loader?: Loader
}

async function getDefaultScale(inputFile: string) {
	const { width, height } = await loadImage(inputFile)
	return { width: width / 3, height: height / 3 }
}

/** One ImageMagick seam-carve (`-liquid-rescale`) of a single frame/image. */
async function awareScaleFrame(ctx: GenerationContext, params: AwareScaleParams): Promise<void> {
	const { config } = ctx
	const { inputFile, outputFile, resize, scale = await getDefaultScale(inputFile) } = params

	const resizeArgs =
		resize != null
			? ['-resize', `${resize.width}x${resize.height}!`]
			: scale.width < 254 && scale.height < 254
				? ['-resize', '254x254!']
				: []

	// MAGICK_LIMITS go first so the caps apply to decode + the carve itself.
	const args = [
		...MAGICK_LIMITS,
		inputFile,
		'-liquid-rescale',
		`${scale.width}x${scale.height}`,
		...resizeArgs,
		outputFile,
	]

	await run(config.IMAGE_MAGICK, args, { timeoutMs: 20000 })
}

/** Seam-carve a single image and re-apply the watermark on top. */
export async function awareScaleImage(
	ctx: GenerationContext,
	params: AwareScaleParams,
): Promise<void> {
	const { resources } = ctx
	const { outputFile, watermark = true } = params

	await awareScaleFrame(ctx, params)
	const scaled = await loadImage(outputFile)
	const { width, height } = scaled

	const canvas = new Canvas(width, height)
	const c = canvas.getContext('2d')
	c.drawImage(scaled, 0, 0)

	if (watermark) {
		transparentWatermark({
			image: resources.templates.watermark,
			ctx: c,
			width,
			height,
			watermark: true,
		})
	}

	await writeFile(outputFile, await canvas.encode('png'))
}

/**
 * Progressively seam-carve every frame of a video (the carve strength ramps up
 * over the clip) and re-mux with the original audio + watermark.
 */
export async function awareScaleVideo(
	ctx: GenerationContext,
	params: AwareScaleVideoParams,
): Promise<void> {
	const { config, resources } = ctx
	const { inputFile, outputFile, loader, watermark = true } = params

	const { fps, frames: frameCount } = await getVideoMetadata(config, inputFile)
	if (frameCount > config.AWARE_SCALE_FRAMES_LIMIT && watermark) {
		throw new TooManyFrames(frameCount, config.AWARE_SCALE_FRAMES_LIMIT)
	}

	// TEMP CLEANUP: everything below runs inside try/finally so a failure or
	// timeout can never leak the extracted frames / carved PNGs to disk.
	const tempDir = await mkdtemp(join(tmpdir(), 'aware-scale-'))
	try {
		loader?.update(1, 'extracting-frames')
		await extractFrames(config, inputFile, tempDir)

		const frames = (await readdir(tempDir)).filter(f => f.endsWith('.png')).sort()
		let { width, height } = await loadImage(join(tempDir, frames[0]))
		width = nearestEven(width)
		height = nearestEven(height)

		const resultDir = join(tempDir, 'result')
		await mkdir(resultDir)

		let count = 0
		// CONFIG FIX: legacy read `config.AWAIT_SCALE_CHUNK` (typo) — undefined,
		// so lodash silently chunked by Infinity. Use the correct key.
		const chunks = chunk(frames, config.AWARE_SCALE_CHUNK)
		for (const [chunkId, group] of chunks.entries()) {
			loader?.update(10 + (chunkId / chunks.length) * 70, 'processing-chunk')
			const tasks: Array<Promise<void>> = []
			for (const frame of group) {
				const scale = Math.floor(512 - (count * 340) / frames.length)
				tasks.push(
					awareScaleFrame(ctx, {
						inputFile: join(tempDir, frame),
						outputFile: join(resultDir, `${count}.png`),
						scale: { width: scale, height: scale },
						resize: { width, height },
					}),
				)
				count++
			}
			await Promise.all(tasks)
		}

		const inputs = ['-i', inputFile, '-r', String(fps), '-i', join(resultDir, '%d.png')]
		const tail: string[] = []
		let input: Uint8Array | undefined

		if (watermark) {
			// WATERMARK SKIP: only add the watermark input + overlay filter when needed.
			const wm = transparentWatermark({
				image: resources.templates.watermark,
				width,
				height,
				watermark: true,
			})
			input = await wm.encode('png')
			inputs.push('-i', '-')
			tail.push('-filter_complex', '[1:v][2:v]overlay=0:0')
		} else {
			tail.push('-map', '1:v')
		}

		const args = [
			...inputs,
			...tail,
			'-c:v',
			'libx264',
			'-threads',
			String(config.MEDIA_THREADS),
			'-preset',
			'veryfast',
			'-crf',
			'24',
			'-pix_fmt',
			'yuv420p',
			'-map',
			'0:a?',
			'-c:a',
			'copy',
			'-y',
			outputFile,
		]

		loader?.update(90, 'encoding-video')
		await run(config.FFMPEG, args, { input, timeoutMs: 30000 })
	} finally {
		await rm(tempDir, { recursive: true, force: true }).catch(() => {})
	}
}
