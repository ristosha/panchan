import type { GenerationContext } from '../context'
import { run } from '../exec'
import { transparentWatermark } from '../watermark'

export interface SphericalParams {
	inputFile: string
	outputFile: string
	watermark?: boolean
}

export interface SphericalConfig {
	/** ffmpeg `v360` projection chain, e.g. `v360=equirect:fisheye:id_fov=360`. */
	transform: string
	/** Watermark canvas dimensions (matches the overlay anchor of legacy code). */
	wmWidth: number
	wmHeight: number
}

/**
 * Shared implementation for the equirectangular projection effects
 * (balloon / fisheye / stretch). Each is a `v360` transform scaled to 512x512
 * with an optional watermark overlay.
 *
 * WATERMARK SKIP: when `watermark === false` we neither build/encode the
 * watermark canvas nor add the second ffmpeg input + overlay filter branch —
 * the projected video is emitted directly (no blank layer composited).
 */
export async function sphericalImage(
	ctx: GenerationContext,
	params: SphericalParams,
	cfg: SphericalConfig,
): Promise<void> {
	const { config, resources } = ctx
	const { inputFile, outputFile, watermark = true } = params

	const inputs = ['-i', inputFile]
	let input: Uint8Array | undefined
	let filter = `[0:v]${cfg.transform},scale=512:512`

	if (watermark) {
		const wm = transparentWatermark({
			image: resources.templates.watermark,
			width: cfg.wmWidth,
			height: cfg.wmHeight,
			watermark: true,
		})
		input = await wm.encode('png')
		inputs.push('-i', '-')
		filter = `[0:v]${cfg.transform},scale=512:512[v];[v][1:v]overlay=0:0`
	}

	const args = [
		...inputs,
		'-filter_complex',
		filter,
		'-aspect',
		'1:1',
		'-vframes',
		'1',
		'-vcodec',
		'png',
		'-y',
		outputFile,
	]

	await run(config.FFMPEG, args, input != null ? { input } : {})
}

export async function sphericalVideo(
	ctx: GenerationContext,
	params: SphericalParams,
	cfg: SphericalConfig,
): Promise<void> {
	const { config, resources } = ctx
	const { inputFile, outputFile, watermark = true } = params

	const inputs = ['-i', inputFile]
	let input: Uint8Array | undefined
	let filter = `[0:v]${cfg.transform},scale=512:512`

	if (watermark) {
		const wm = transparentWatermark({
			image: resources.templates.watermark,
			width: cfg.wmWidth,
			height: cfg.wmHeight,
			watermark: true,
		})
		input = await wm.encode('png')
		inputs.push('-i', '-')
		filter = `[0:v]${cfg.transform},scale=512:512[v];[v][1:v]overlay=0:0`
	}

	const args = [
		...inputs,
		'-filter_complex',
		filter,
		'-aspect',
		'1:1',
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

	await run(config.FFMPEG, args, { input, timeoutMs: 30000 })
}
