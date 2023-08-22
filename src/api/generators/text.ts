import { Canvas, loadImage } from '@napi-rs/canvas'
import { execa } from 'execa'

import { multiline } from '~/api/generators/text/multiline.js'
import { getOppositeCorner, transparentWatermark } from '~/api/generators/watermark.js'
import { textDefaults } from '~/api/schema/constants.js'
import { type TextOptions, textOptions } from '~/api/schema/text.js'
import { nearestEven } from '~/api/utils.js'
import { getVideoMetadata } from '~/api/video.js'
import { config } from '~/config.js'

export interface CreateTextImageParams {
  inputFile: string
  text: string
  watermark?: boolean
  opts?: Partial<TextOptions>
}

export interface CreateTextVideoParams extends CreateTextImageParams {
  outputFile: string
  meta?: { width: number, height: number, duration: number }
}

export async function createTextImage (params: CreateTextImageParams) {
  const {
    inputFile,
    text,
    watermark = true,
    opts = {}
  } = params

  const image = await loadImage(inputFile)
  const { width, height } = image

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  const options = textOptions.parse({ ...textDefaults, ...opts })

  ctx.drawImage(image, 0, 0)
  multiline(ctx, text, options)
  transparentWatermark({ ctx, width, height, watermark })

  return await canvas.encode('png')
}

export async function createTextVideo (params: CreateTextVideoParams, format: 'webm' | 'mp4' = 'mp4') {
  const {
    inputFile,
    outputFile,
    text,
    meta,
    watermark = true,
    opts = {}
  } = params
  let { width, height, duration } = meta ?? await getVideoMetadata(inputFile)
  width = nearestEven(width)
  height = nearestEven(height)

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  const options = textOptions.parse({ ...textDefaults, ...opts })

  multiline(ctx, text, options)
  transparentWatermark({ watermark, width, height, ...getOppositeCorner(options) })

  const args = [
    '-i', inputFile, // video stream
    '-i', '-', // canvas stream
    '-y',
    '-filter_complex', `[0:v]scale=${width}:${height}[v];[v][1:v]overlay=0:0`,
    '-threads', '4',
    ...(format === 'webm'
      ? [
          '-c:v', 'libvpx',
          '-f', 'webm'
        ]
      : [
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-f', 'mp4'
        ]),
    '-pix_fmt', 'yuv420p',
    '-movflags', 'frag_keyframe+empty_moov',
    '-loop', String(duration),
    '-map', '1:v', '-map', '0:a?', '-c:a', 'copy',
    '-an',
    outputFile
  ]

  await execa(config.FFMPEG, args, {
    input: await canvas.encode('png')
  })
}
