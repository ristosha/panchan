import { Canvas, loadImage } from '@napi-rs/canvas'
import { execa } from 'execa'
import { join } from 'path'

import { multiline } from '~/api/generators/text/multiline.js'
import { templatePath } from '~/api/resources.js'
import { demotivatorDefaults } from '~/api/schema/constants.js'
import { type TextOptions, textOptions } from '~/api/schema/text.js'
import { getVideoMetadata } from '~/api/video.js'
import { config } from '~/config.js'

export interface CreateDemotivatorParams {
  inputFile: string
  text: string
  watermark?: boolean
  circle?: boolean
  opts?: TextOptions | Record<string, any>
}

export interface CreateDemotivatorVideoParams extends CreateDemotivatorParams {
  outputFile: string
  duration?: number
}

export const template = await loadImage(join(templatePath, 'demotivator.png'))
export const circleTemplate = await loadImage(join(templatePath, 'circle_demotivator.png'))
export const demotivatorWatermark = await loadImage(join(templatePath, 'demotivator_watermark.png'))
export const circleDemotivatorWatermark = await loadImage(join(templatePath, 'circle_demotivator_watermark.png'))

export async function createDemotivatorImage (params: CreateDemotivatorParams) {
  const {
    inputFile,
    text,
    watermark = true,
    circle = false,
    opts = {}
  } = params

  const image = await loadImage(inputFile)
  const { width, height } = template

  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(circle ? circleTemplate : template, 0, 0)
  ctx.drawImage(image, 29, 29, 380, 380)
  multiline(ctx, text, textOptions.parse({ ...demotivatorDefaults, ...opts }))
  if (watermark) {
    if (circle) ctx.drawImage(circleDemotivatorWatermark, 273, 0)
    else ctx.drawImage(demotivatorWatermark, 250, 8)
  }

  return await canvas.encode('png')
}

export async function createDemotivatorVideo (params: CreateDemotivatorVideoParams) {
  const {
    inputFile,
    outputFile,
    text,
    watermark = true,
    circle = false,
    opts = {},
    duration = (await getVideoMetadata(inputFile)).duration
  } = params

  const { width, height } = template
  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(circle ? circleTemplate : template, 0, 0)
  multiline(ctx, text, { ...demotivatorDefaults, ...opts })
  if (watermark) {
    if (circle) ctx.drawImage(circleDemotivatorWatermark, 273, 0)
    else ctx.drawImage(demotivatorWatermark, 250, 8)
  }

  const overlay = await canvas.encode('png')
  const args = [
    '-i', inputFile,
    '-i', '-',
    '-filter_complex', [
      `[0:v]scale=380:380,pad=${width}:${height}:29:29:black[v]`,
      '[v][1:v]overlay=0:0,setdar=436/512'
    ].join(';'),
    '-threads', String(config.MEDIA_THREADS),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov',
    '-loop', String(duration),
    '-map', '1:v',
    '-map', '0:a?',
    // '-an',
    '-y',
    outputFile
  ]

  await execa(config.FFMPEG, args, { input: overlay })
}
