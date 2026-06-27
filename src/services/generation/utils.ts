/** Round to the nearest even integer (x264 / yuv420p require even dimensions). */
export function nearestEven(num: number): number {
	return Math.round(num / 2) * 2
}

/** Split an array into consecutive chunks of at most `size` elements. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
	const out: T[][] = []
	const step = Math.max(1, size)
	for (let i = 0; i < items.length; i += step) {
		out.push(items.slice(i, i + step))
	}
	return out
}
