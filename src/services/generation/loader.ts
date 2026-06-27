type LoaderFunc = (step: string, progress: number, remainingSeconds: number) => unknown

export type Loader = ReturnType<typeof createLoader>

/**
 * Progress reporter for long-running (video) generation. Pure: it only invokes
 * subscriber callbacks — wiring to a Telegram "⏳" message lives in the bot
 * layer. Ported verbatim from the legacy engine.
 */
export function createLoader() {
	let step = ''
	let progress = 1
	let startTime: number | null = null
	const listeners: Array<{
		func: LoaderFunc
		interval: number
		lastProgress: number
	}> = []

	const announce = () => {
		void Promise.all(
			listeners
				.filter(({ interval, lastProgress }) => {
					const lastStep = Math.floor(lastProgress / interval)
					const currentStep = Math.floor(progress / interval)
					return currentStep > lastStep
				})
				.map(listener => {
					listener.lastProgress = progress

					const elapsedTime = (Date.now() - (startTime ?? Date.now())) / 1000
					const remainingTime = (elapsedTime * (100 - progress)) / progress

					return listener.func(step, Math.floor(progress), Math.round(remainingTime))
				}),
		).catch(() => {})
	}

	return {
		updateStep: (newStep: string) => {
			step = newStep
			announce()
		},
		update(newProgress: number, newStep?: string) {
			if (startTime == null) startTime = Date.now()

			progress = newProgress
			if (newStep != null) step = newStep

			announce()
		},
		subscribe(func: LoaderFunc, interval = 1) {
			listeners.push({ func, interval, lastProgress: 0 })
		},
	}
}
