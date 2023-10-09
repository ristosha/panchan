import { execa } from 'execa'

import { transparentWatermark } from '~/api/generators/watermark.js'
import { config } from '~/config.js'

interface FisheyeParams {
  inputFile: string
  outputFile: string
  watermark?: boolean
}

export async function fisheyeImage (params: FisheyeParams) {
  const {
    inputFile,
    outputFile,
    watermark = true
  } = params

  const args = [
    '-i', inputFile,
    '-i', '-',
    '-filter_complex', '[0:v]v360=equirect:fisheye:id_fov=360,scale=512:512[v];[v][1:v]overlay=0:0',
    '-aspect', '1:1',
    '-vframes', '1',
    '-vcodec', 'png',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width: 512, height: 512, watermark })
  await execa(config.FFMPEG, args, { encoding: null, input: await wm.encode('png') })
}

export async function fisheyeVideo (params: FisheyeParams) {
  const {
    inputFile,
    outputFile,
    watermark = true
  } = params

  const args = [
    '-i', inputFile,
    '-i', '-',
    '-filter_complex', '[0:v]v360=equirect:fisheye:id_fov=360,scale=512:512[v];[v][1:v]overlay=0:0',
    '-aspect', '1:1',
    '-threads', String(config.MEDIA_THREADS),
    '-c:v', 'libx264',
    '-threads', '4',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-map', '0:a?',
    '-c:a', 'copy',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width: 512, height: 512, watermark })
  await execa(config.FFMPEG, args, {
    timeout: 30000,
    encoding: null,
    input: await wm.encode('png')
  })
}
