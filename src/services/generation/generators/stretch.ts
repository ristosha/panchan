import type { GenerationContext } from '../context'
import { type SphericalParams, sphericalImage, sphericalVideo } from './spherical'

export type StretchParams = SphericalParams

const CFG = { transform: 'v360=equirect:pannini', wmWidth: 512, wmHeight: 512 }

/** Pannini ("stretch") projection. */
export function stretchImage(ctx: GenerationContext, params: StretchParams): Promise<void> {
	return sphericalImage(ctx, params, CFG)
}

export function stretchVideo(ctx: GenerationContext, params: StretchParams): Promise<void> {
	return sphericalVideo(ctx, params, CFG)
}
