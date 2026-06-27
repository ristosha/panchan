import type { GenerationContext } from '../context'
import { type SphericalParams, sphericalImage, sphericalVideo } from './spherical'

export type FisheyeParams = SphericalParams

const CFG = { transform: 'v360=equirect:fisheye:id_fov=360', wmWidth: 512, wmHeight: 512 }

/** Fisheye lens warp. */
export function fisheyeImage(ctx: GenerationContext, params: FisheyeParams): Promise<void> {
	return sphericalImage(ctx, params, CFG)
}

export function fisheyeVideo(ctx: GenerationContext, params: FisheyeParams): Promise<void> {
	return sphericalVideo(ctx, params, CFG)
}
