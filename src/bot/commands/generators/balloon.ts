import { createSphericalCommand } from './spherical-command'

export const balloon = createSphericalCommand({
	aliases: ['balloon', 'ballon', 'balon', 'baloon', 'шар', 'шарик'],
	type: 'BALLOON',
	videoKind: 'video_note',
	image: (ctx, p) => ctx.deps.gen.balloonImage(p),
	video: (ctx, p) => ctx.deps.gen.balloonVideo(p),
})
