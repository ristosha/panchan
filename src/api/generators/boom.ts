import { loadImage } from '@napi-rs/canvas'
import { execa } from 'execa'
import { join } from 'path'

import { transparentWatermark } from '~/api/generators/watermark.js'
import { templatePath } from '~/api/resources.js'
import { getVideoMetadata } from '~/api/video.js'
import { config } from '~/config.js'

// todo 3.0: this generator doesn't work properly, need fix
export const boomFolder = join(templatePath, 'boom')

const verticalTemplates = [
  '1-vertical',
  '2-vertical',
  '3-vertical'
]

const horizontalTemplates = [
  '1-horizontal',
  '2-horizontal',
  '3-horizontal'
]

const squareTemplates = [
  '1-square',
  '2-square',
  '3-square'
]

export const templates = [...verticalTemplates, ...horizontalTemplates, ...squareTemplates]

export function chooseRandomTemplate (width: number, height: number): string {
  const ratio = width / height
  let templates: string[]
  if (ratio > 1.3) {
    templates = horizontalTemplates
  } else if (ratio < 0.7) {
    templates = verticalTemplates
  } else {
    templates = squareTemplates
  }
  const index = Math.floor(Math.random() * templates.length)
  return templates[index]
}

export interface BoomParams {
  inputFile: string
  outputFile: string
  template?: string
  watermark?: boolean
  meta?: { width: number, height: number, hasAudio: boolean }
}

export async function boomImage (params: BoomParams) {
  let {
    inputFile,
    outputFile,
    meta: { width, height } = await loadImage(inputFile),
    template = chooseRandomTemplate(width, height),
    watermark = true
  } = params

  if (!templates.includes(template)) template = chooseRandomTemplate(width, height)

  const args = [
    '-i', inputFile,
    '-i', join(boomFolder, `${template}.mp4`),
    '-i', '-',
    '-filter_complex', [
      `[0:v]loop=loop=${3 * 30}:size=1:start=0[media]`,
      '[1:v][media]scale2ref[boom][media]',
      '[media]setsar=1[media]',
      '[boom]setsar=1[boom]',
      '[media][boom]concat=n=2:v=1:a=0[v]',
      '[v][2:v]overlay=0:0[v2]'
    ].join(';'),
    '-threads', '4',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov',
    '-map', '[v2]',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width, height, watermark })
  await execa(config.FFMPEG, args, { encoding: null, input: await wm.encode('png') })
}

export async function boomVideo (params: BoomParams) {
  let {
    inputFile,
    outputFile,
    meta: { width, height, hasAudio } = await getVideoMetadata(inputFile),
    template = chooseRandomTemplate(width, height),
    watermark = true
  } = params

  if (!templates.includes(template)) template = chooseRandomTemplate(width, height)

  const args = [
    '-i', inputFile,
    '-i', join(boomFolder, `${template}.mp4`),
    '-i', '-',
    '-filter_complex', [
      '[1:v][0:v]scale2ref[boom][media]',
      '[media]setsar=1[media]',
      '[boom]setsar=1[boom]',
      hasAudio
        ? '[media][0:a][boom][1:a]concat=n=2:v=1:a=1[v][a]'
        : '[media][boom]concat=n=2:v=1:a=0[v]',
      '[v][2:v]overlay=0:0[v2]'
    ].join(';'),
    '-map', '[v2]',
    ...(hasAudio ? ['-map', '[a]'] : []),
    '-threads', '4',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov',
    '-y',
    outputFile
  ]

  const wm = transparentWatermark({ width, height, watermark })
  await execa(config.FFMPEG, args, { encoding: null, input: await wm.encode('png') })
}
