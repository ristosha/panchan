/**
 * Typed errors for the media generation engine.
 *
 * Legacy code threw messageless `new Error()` on ffmpeg/ImageMagick failure,
 * which made queue-level error handling guess at the cause. Every failure here
 * carries a descriptive message and a stable class for `instanceof` checks.
 */

export class GenerationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'GenerationError'
	}
}

/** Aware-scale video exceeded the configured frame budget for watermarked jobs. */
export class TooManyFrames extends GenerationError {
	constructor(
		readonly frames: number,
		readonly limit: number,
	) {
		super(`too many frames: ${frames}/${limit}`)
		this.name = 'TooManyFrames'
	}
}

/** A subprocess (ffmpeg / ffprobe / ImageMagick) exited non-zero or timed out. */
export class SubprocessError extends GenerationError {
	constructor(
		readonly bin: string,
		readonly args: readonly string[],
		readonly exitCode: number | null,
		readonly stderr: string,
		reason: string,
	) {
		// keep only the tail of stderr — ffmpeg is extremely verbose
		const tail = stderr.length > 2000 ? stderr.slice(-2000) : stderr
		super(`${bin} ${reason} (exit=${exitCode ?? 'killed'})\nargs: ${args.join(' ')}\n${tail}`)
		this.name = 'SubprocessError'
	}
}
