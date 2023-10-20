import { Canvas, loadImage } from '@napi-rs/canvas'
import fs from '@supercharge/fs'
import { execa } from 'execa'
import _ from 'lodash'
import { join } from 'path'

import { TooManyFrames } from '~/api/errors.js'
import { transparentWatermark } from '~/api/generators/watermark.js'
import { type Loader } from '~/api/loader.js'
import { nearestEven } from '~/api/utils.js'
import { extractFrames, getVideoMetadata } from '~/api/video.js'
import { config } from '~/config.js'

export interface AwareScaleParams {
  inputFile: string
  outputFile: string
  watermark?: boolean
  scale?: { width: number, height: number }
  resize?: { width: number, height: number }
}

export interface AwareScaleVideoParams extends AwareScaleParams {
  loader?: Loader
}

async function getDefaultScale (inputFile: string) {
  const image = await loadImage(inputFile)
  return { width: image.width / 3, height: image.height / 3 }
}

async function awareScaleFrame (params: AwareScaleParams) {
  const {
    inputFile,
    outputFile,
    resize,
    scale = await getDefaultScale(inputFile)
  } = params

  const resizeArgs = (resize != null)
    ? ['-resize', `${resize.width}x${resize.height}!`]
    : scale.width < 254 && scale.height < 254
      ? ['-resize', '254x254!']
      : []

  const args = [
    inputFile,
    '-liquid-rescale', `${scale.width}x${scale.height}`,
    ...resizeArgs,
    outputFile
  ]

  const { failed, killed } = await execa(config.IMAGE_MAGICK, args, { timeout: 20000 })
  if (failed || killed) throw new Error()
}

export async function awareScaleImage (params: AwareScaleParams) {
  const { outputFile, watermark = true } = params

  await awareScaleFrame(params)
  const scaled = await loadImage(outputFile)
  const { width, height } = scaled

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(scaled, 0, 0)

  if (watermark) transparentWatermark({ ctx, width, height })
  const buffer = await canvas.encode('png')

  await fs.writeFile(outputFile, buffer)
}

export async function awareScaleVideo (params: AwareScaleVideoParams) {
  const {
    inputFile,
    outputFile,
    loader,
    watermark = true
  } = params

  const { fps, frames: frameCount } = await getVideoMetadata(inputFile)
  if (frameCount > config.AWARE_SCALE_FRAMES_LIMIT && watermark) {
    throw new TooManyFrames(`${frameCount}/${config.AWARE_SCALE_FRAMES_LIMIT}`)
  }

  const tempDir = await fs.tempDir()

  loader?.update(1, 'extracting-frames')
  await extractFrames(inputFile, tempDir)

  const frames = await fs.files(tempDir)
  let { width, height } = await loadImage(join(tempDir, frames[0]))
  width = nearestEven(width)
  height = nearestEven(height)

  const resultDir = join(tempDir, 'result')
  await fs.mkdir(resultDir)

  let count = 0
  const chunks = _.chunk(frames, config.AWAIT_SCALE_CHUNK)
  for (const [chunkId, chunk] of chunks.entries()) {
    loader?.update(10 + chunkId / chunks.length * 70, 'processing-chunk')
    const tasks: Array<Promise<void>> = []
    for (const frame of chunk) {
      const scale = Math.floor(512 - (count * 340 / frames.length))
      const task = awareScaleImage({
        inputFile: join(tempDir, frame),
        outputFile: join(resultDir, `${count}.png`),
        scale: { width: scale, height: scale },
        resize: { width, height }
      })
      tasks.push(task)
      count++
    }
    await Promise.all(tasks)
  }

  const args = [
    '-i', inputFile,
    '-r', String(fps),
    '-i', join(resultDir, '%d.png'),
    '-i', '-',
    '-c:v', 'libx264',
    '-threads', String(config.MEDIA_THREADS),
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-map', '1:v',
    '-map', '0:a?',
    '-c:a', 'copy',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width, height, watermark })

  loader?.update(90, 'encoding-video')
  const { failed, killed } = await execa(config.FFMPEG, args, { input: await wm.encode('png'), timeout: 30000 })
  await fs.removeDir(tempDir)

  if (failed || killed) throw new Error()
}
