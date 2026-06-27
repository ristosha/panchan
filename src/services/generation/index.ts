import type { Config } from '@/platform/config'
import type { Logger } from '@/platform/logger'

import type { GenerationContext } from './context'
import {
	type AwareScaleParams,
	type AwareScaleVideoParams,
	awareScaleImage,
	awareScaleVideo,
} from './generators/aware-scale'
import { type BalloonParams, balloonImage, balloonVideo } from './generators/balloon'
import { type BoomParams, boomImage, boomVideo } from './generators/boom'
import {
	type CreateDemotivatorParams,
	type CreateDemotivatorVideoParams,
	createDemotivatorImage,
	createDemotivatorVideo,
} from './generators/demotivator'
import { type FisheyeParams, fisheyeImage, fisheyeVideo } from './generators/fisheye'
import { type StretchParams, stretchImage, stretchVideo } from './generators/stretch'
import {
	type CreateTextImageParams,
	type CreateTextVideoParams,
	createTextImage,
	createTextVideo,
} from './generators/text'
import { createResources, type Resources } from './resources'

// ── re-exports: types, helpers, errors ──
export type { GenerationContext } from './context'
export { GenerationError, SubprocessError, TooManyFrames } from './errors'
export { run } from './exec'
export { getPhotoDimensions } from './image'
export { createLoader, type Loader } from './loader'
export type { Resources } from './resources'
export { createResources } from './resources'
export {
	demotivatorDefaults,
	parseTextOptions,
	type TextOptions,
	textDefaults,
} from './text/options'
export { extractFrames, getVideoMetadata, type VideoMetadata } from './video'

export interface CreateGenerationEngineOptions {
	config: Config
	logger: Logger
	/** Defaults to `<cwd>/resources`. */
	resourcesDir?: string
	/** Inject already-loaded resources (e.g. for tests) instead of reading disk. */
	resources?: Resources
}

export type GenerationEngine = Awaited<ReturnType<typeof createGenerationEngine>>

/**
 * Build the media generation engine: load fonts/templates once, then expose
 * every generator pre-bound to a {@link GenerationContext}. Pure transforms —
 * input file -> output file/buffer — no database, no global singletons.
 */
export async function createGenerationEngine(opts: CreateGenerationEngineOptions) {
	const logger = opts.logger.named('generation')
	const resources =
		opts.resources ?? (await createResources({ logger, resourcesDir: opts.resourcesDir }))
	const ctx: GenerationContext = { config: opts.config, logger, resources }

	return {
		ctx,
		resources,

		awareScaleImage: (p: AwareScaleParams) => awareScaleImage(ctx, p),
		awareScaleVideo: (p: AwareScaleVideoParams) => awareScaleVideo(ctx, p),

		balloonImage: (p: BalloonParams) => balloonImage(ctx, p),
		balloonVideo: (p: BalloonParams) => balloonVideo(ctx, p),

		boomImage: (p: BoomParams) => boomImage(ctx, p),
		boomVideo: (p: BoomParams) => boomVideo(ctx, p),

		fisheyeImage: (p: FisheyeParams) => fisheyeImage(ctx, p),
		fisheyeVideo: (p: FisheyeParams) => fisheyeVideo(ctx, p),

		stretchImage: (p: StretchParams) => stretchImage(ctx, p),
		stretchVideo: (p: StretchParams) => stretchVideo(ctx, p),

		createDemotivatorImage: (p: CreateDemotivatorParams) => createDemotivatorImage(ctx, p),
		createDemotivatorVideo: (p: CreateDemotivatorVideoParams) => createDemotivatorVideo(ctx, p),

		createTextImage: (p: CreateTextImageParams) => createTextImage(ctx, p),
		createTextVideo: (p: CreateTextVideoParams, format?: 'webm' | 'mp4') =>
			createTextVideo(ctx, p, format),
	}
}
