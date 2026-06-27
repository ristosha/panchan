import { join } from 'node:path'

import type { Config } from '@/platform/config'

import { run } from './exec'

export interface VideoMetadata {
	duration: number
	width: number
	height: number
	fps: number
	hasAudio: boolean
	frames: number
}

export async function getVideoMetadata(config: Config, inputFile: string): Promise<VideoMetadata> {
	const { stdout } = await run(config.FFPROBE, [
		'-v',
		'error',
		'-i',
		inputFile,
		'-show_entries',
		'format=duration:stream=width,height,r_frame_rate,codec_type,nb_frames',
		'-of',
		'json',
	])

	const parsed = JSON.parse(stdout.toString()) as {
		format: { duration: string }
		streams: Array<{
			codec_type: string
			width?: number
			height?: number
			r_frame_rate?: string
			nb_frames?: string
		}>
	}

	const { streams } = parsed
	const hasAudio = streams.some(s => s.codec_type === 'audio')
	const video = streams.find(s => s.codec_type === 'video')
	if (video == null) throw new Error(`no video stream in ${inputFile}`)

	const [fpsNumerator, fpsDenominator] = (video.r_frame_rate ?? '0/1').split('/').map(Number)
	const fps = Math.floor(fpsNumerator / fpsDenominator)

	return {
		duration: Number(parsed.format.duration),
		width: video.width ?? 0,
		height: video.height ?? 0,
		fps,
		hasAudio,
		frames: Number(video.nb_frames ?? 0),
	}
}

/**
 * Frame pattern for extraction. Legacy used uncompressed `%04d.bmp`.
 *
 * FRAME-CHURN FIX: we now extract to compressed PNG instead. Aware-scale has to
 * spawn one `magick -liquid-rescale` per frame regardless (seam carving is
 * inherently per-frame and can't be batched into a single ffmpeg pass), so the
 * process count is bounded by AWARE_SCALE_FRAMES_LIMIT either way. The win is
 * IO: raw BMP frames are ~10-50x larger than PNG, and the old path wrote BMP,
 * re-read BMP, then wrote PNG ("triple IO"). PNG-in / PNG-out keeps the same
 * pixels with a fraction of the bytes on a disk-constrained box.
 */
export const frameFormat = '%04d.png'

export async function extractFrames(
	config: Config,
	inputFile: string,
	outDir: string,
): Promise<void> {
	await run(config.FFMPEG, [
		'-i',
		inputFile,
		'-threads',
		String(config.MEDIA_THREADS),
		'-vf',
		"scale='if(lte(ih,iw), 512, -2)':'if(lte(iw,ih), 512, -2)'",
		'-pix_fmt',
		'yuv420p',
		'-y',
		join(outDir, frameFormat),
	])
}
