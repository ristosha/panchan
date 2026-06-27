import type { GenerationContext } from '../context'
import { type SphericalParams, sphericalImage, sphericalVideo } from './spherical'

export type BalloonParams = SphericalParams

const TRANSFORM = 'v360=equirect:og:id_fov=360'

/** Watermark anchored to the balloon template's own dimensions (legacy parity). */
function cfg(ctx: GenerationContext) {
	const { balloon } = ctx.resources.templates
	return { transform: TRANSFORM, wmWidth: balloon.width, wmHeight: balloon.height }
}

/** Wrap the image onto a sphere ("balloon" / orthographic projection). */
export function balloonImage(ctx: GenerationContext, params: BalloonParams): Promise<void> {
	return sphericalImage(ctx, params, cfg(ctx))
}

export function balloonVideo(ctx: GenerationContext, params: BalloonParams): Promise<void> {
	return sphericalVideo(ctx, params, cfg(ctx))
}
