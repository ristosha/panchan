import { Buffer } from 'node:buffer'

import { SubprocessError } from './errors'

export interface RunOptions {
	/** Data piped to the child's stdin (e.g. a PNG watermark for ffmpeg `-i -`). */
	input?: Uint8Array
	/** Hard wall-clock limit; the process is SIGKILLed and the call rejects. */
	timeoutMs?: number
}

export interface RunResult {
	stdout: Buffer
	stderr: string
	exitCode: number
}

/**
 * Safe Bun-native subprocess runner.
 *
 * Replaces the legacy `execa` / `execaCommand` usage. The old `execaCommand`
 * built a single shell string and interpolated user-controlled file paths into
 * it (`${config.IMAGE_MAGICK} identify ... ${inputFile}`) — fragile (spaces /
 * quoting) and a shell-injection risk. This always passes an ARRAY of args
 * straight to `Bun.spawn`, so there is no shell and nothing to escape.
 *
 * Rejects with a {@link SubprocessError} on non-zero exit or timeout.
 */
export async function run(bin: string, args: string[], opts: RunOptions = {}): Promise<RunResult> {
	const proc = Bun.spawn([bin, ...args], {
		stdin: opts.input ?? 'ignore',
		stdout: 'pipe',
		stderr: 'pipe',
	})

	let timedOut = false
	let timer: ReturnType<typeof setTimeout> | undefined
	if (opts.timeoutMs != null) {
		timer = setTimeout(() => {
			timedOut = true
			proc.kill('SIGKILL')
		}, opts.timeoutMs)
	}

	try {
		const [stdoutBuf, stderr, exitCode] = await Promise.all([
			new Response(proc.stdout).arrayBuffer(),
			new Response(proc.stderr).text(),
			proc.exited,
		])

		if (timedOut) {
			throw new SubprocessError(bin, args, exitCode, stderr, `timed out after ${opts.timeoutMs}ms`)
		}
		if (exitCode !== 0) {
			throw new SubprocessError(bin, args, exitCode, stderr, 'failed')
		}

		return { stdout: Buffer.from(stdoutBuf), stderr, exitCode }
	} finally {
		if (timer != null) clearTimeout(timer)
	}
}
