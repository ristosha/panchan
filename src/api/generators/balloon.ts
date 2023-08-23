import { loadImage } from '@napi-rs/canvas'
import { execa } from 'execa'
import { join } from 'path'

import { transparentWatermark } from '~/api/generators/watermark.js'
import { templatePath } from '~/api/resources.js'
import { config } from '~/config.js'

export const template = await loadImage(join(templatePath, 'balloon.png'))

export interface BalloonParams {
  inputFile: string
  outputFile: string
  watermark?: boolean
}

const defaultArgs = [
  '-i', '-',
  '-y',
  '-filter_complex', '[0:v]v360=equirect:og:id_fov=360,scale=512:512[v];[v][1:v]overlay=0:0',
  '-aspect', '1:1'
]

export async function balloonImage (params: BalloonParams) {
  const { inputFile, outputFile, watermark = true } = params
  const { width, height } = template

  const args = [
    '-i', inputFile,
    ...defaultArgs,
    '-vframes', '1',
    '-vcodec', 'png',
    outputFile
  ]

  const wm = transparentWatermark({ width, height, watermark })
  await execa(config.FFMPEG, args, { input: await wm.encode('png') })
}

export async function balloonVideo (params: BalloonParams) {
  const { inputFile, outputFile, watermark = true } = params
  const { width, height } = template

  const args = [
    '-i', inputFile,
    ...defaultArgs,
    '-c:v', 'libx264',
    '-threads', String(config.MEDIA_THREADS),
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-map', '0:a?',
    '-c:a', 'copy',
    outputFile
  ]

  const wm = transparentWatermark({ width, height, watermark })
  await execa(config.FFMPEG, args, { input: await wm.encode('png') })
}
