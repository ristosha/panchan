import { loadImage } from '@napi-rs/canvas'
import { execa } from 'execa'

import { transparentWatermark } from '~/api/generators/watermark.js'
import { getVideoMetadata } from '~/api/video.js'
import { config } from '~/config.js'

interface StretchParams {
  inputFile: string
  outputFile: string
  watermark?: boolean
}

export async function stretchImage (params: StretchParams) {
  const {
    inputFile,
    outputFile,
    watermark = true
  } = params

  const args = [
    '-i', inputFile,
    '-i', '-',
    '-filter_complex', '[0:v]v360=equirect:pannini,scale=512:512[v];[v][1:v]overlay=0:0',
    '-aspect', '1:1',
    '-vframes', '1',
    '-vcodec', 'png',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width: 512, height: 512, watermark })
  await execa(config.FFMPEG, args, { encoding: null, input: await wm.encode('png') })
}

export async function stretchVideo (params: StretchParams) {
  const {
    inputFile,
    outputFile,
    watermark = true
  } = params

  const args = [
    '-i', inputFile,
    '-i', '-',
    '-filter_complex', '[0:v]v360=equirect:pannini,scale=512:512[v];[v][1:v]overlay=0:0',
    '-aspect', '1:1',
    '-c:v', 'libx264',
    // '-threads', '4',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-map', '0:a?',
    '-c:a', 'copy',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width: 512, height: 512, watermark })
  await execa(config.FFMPEG, args, { encoding: null, input: await wm.encode('png') })
}
