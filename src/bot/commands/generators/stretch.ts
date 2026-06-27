import { createSphericalCommand } from './spherical-command'

export const stretch = createSphericalCommand({
	aliases: ['stretch', 'str', 'растянуть', 'раст'],
	type: 'STRETCH',
	videoKind: 'animation',
	image: (ctx, p) => ctx.deps.gen.stretchImage(p),
	video: (ctx, p) => ctx.deps.gen.stretchVideo(p),
})
