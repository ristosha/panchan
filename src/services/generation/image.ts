import type { Config } from '@/platform/config'

import { run } from './exec'

export interface PhotoDimensions {
	width: number
	height: number
}

/**
 * Resource limits applied to EVERY ImageMagick invocation.
 *
 * On the 2-core / 3.8GB box a single seam-carve (`-liquid-rescale`) on a large
 * frame could otherwise balloon RAM and spill huge cache files to disk. These
 * caps (plus container `MAGICK_THREAD_LIMIT=1`) keep each `magick` process
 * single-threaded and bounded. Spread these into the arg array right after the
 * binary, before any input/operators.
 */
export const MAGICK_LIMITS: readonly string[] = [
	'-limit',
	'memory',
	'256MiB',
	'-limit',
	'map',
	'512MiB',
	'-limit',
	'area',
	'64MP',
	'-limit',
	'disk',
	'1GiB',
	'-limit',
	'thread',
	'1',
]

export async function getPhotoDimensions(
	config: Config,
	inputFile: string,
): Promise<PhotoDimensions> {
	const { stdout } = await run(config.IMAGE_MAGICK, [
		'identify',
		...MAGICK_LIMITS,
		'-format',
		'%w:%h',
		inputFile,
	])
	const [width, height] = stdout.toString().trim().split(':').map(Number)
	return { width, height }
}
