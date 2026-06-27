import type { Logger } from '@/platform/logger'

export interface QueueTask<T> {
	run: () => Promise<T>
	onEnqueued?: (position: number) => void | Promise<void>
	onStart?: () => void | Promise<void>
}

/**
 * Global concurrency-limited job runner for CPU-heavy media generation.
 *
 * The legacy design used per-name `Queue` instances, so an aware-scale job (5
 * concurrent ImageMagick processes) could run alongside a `default` ffmpeg job
 * — unbounded oversubscription on a 2-core box. This enforces a single
 * machine-wide concurrency ceiling (GEN_CONCURRENCY, default 1) across every
 * generation request regardless of type, while still reporting queue position.
 */
export class GenerationQueue {
	private active = 0
	private readonly waiting: Array<() => void> = []
	private readonly processingTimes: number[] = []

	constructor(
		private readonly logger: Logger,
		private readonly concurrency: number,
	) {}

	get pending(): number {
		return this.waiting.length
	}

	get estimatedWaitMs(): number {
		if (this.processingTimes.length === 0) return 0
		const avg = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
		return Math.ceil((avg * this.waiting.length) / Math.max(1, this.concurrency))
	}

	async enqueue<T>(task: QueueTask<T>): Promise<T> {
		const position = this.active + this.waiting.length
		await task.onEnqueued?.(position)

		await this.acquire()
		const started = Date.now()
		try {
			await task.onStart?.()
			return await task.run()
		} finally {
			const elapsed = Date.now() - started
			this.processingTimes.push(elapsed)
			if (this.processingTimes.length > 30) this.processingTimes.shift()
			this.release()
		}
	}

	private acquire(): Promise<void> {
		if (this.active < this.concurrency) {
			this.active++
			return Promise.resolve()
		}
		return new Promise<void>(resolve => {
			this.waiting.push(() => {
				this.active++
				resolve()
			})
		})
	}

	private release(): void {
		this.active--
		const next = this.waiting.shift()
		if (next) next()
	}
}
