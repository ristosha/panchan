import { createSphericalCommand } from './spherical-command'

export const fisheye = createSphericalCommand({
	aliases: ['fisheye', 'eye', 'feye', 'вриба', 'врыба', 'риба', 'рыба'],
	type: 'FISHEYE',
	videoKind: 'animation',
	image: (ctx, p) => ctx.deps.gen.fisheyeImage(p),
	video: (ctx, p) => ctx.deps.gen.fisheyeVideo(p),
})
