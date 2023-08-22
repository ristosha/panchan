import { Canvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas'
import { join } from 'path'

import { templatePath } from '~/api/resources.js'

export const watermark = await loadImage(join(templatePath, 'watermark.png'))

export interface WatermarkParams {
  width: number
  height: number
  ctx?: SKRSContext2D
  watermark?: boolean
  verticalAlign?: 'bottom' | 'center' | 'top'
  horizontalAlign?: 'left' | 'center' | 'right'
}

export function transparentWatermark (params: WatermarkParams) {
  const {
    width,
    height,
    watermark: watermarkEnabled = true,
    ctx = new Canvas(width, height).getContext('2d'),
    verticalAlign = 'bottom',
    horizontalAlign = 'right'
  } = params
  if (!watermarkEnabled) return ctx.canvas

  const watermarkWidth = watermark.width
  const watermarkHeight = watermark.height

  let x = 0
  let y = height - watermarkHeight

  if (horizontalAlign === 'center') {
    x = (width - watermarkWidth) / 2
  } else if (horizontalAlign === 'right') {
    x = width - watermarkWidth
  }
  if (verticalAlign === 'center') {
    y = (height - watermarkHeight) / 2
  } else if (verticalAlign === 'top') {
    y = 0
  }

  ctx.drawImage(watermark, x, y)
  return ctx.canvas
}

export function getOppositeCorner (options: Pick<WatermarkParams, 'verticalAlign' | 'horizontalAlign'>) {
  let horizontalOpposite: 'left' | 'center' | 'right'
  let verticalOpposite: 'bottom' | 'center' | 'top'
  if (options.horizontalAlign === 'left') {
    horizontalOpposite = 'right'
  } else if (options.horizontalAlign === 'right') {
    horizontalOpposite = 'left'
  } else {
    horizontalOpposite = 'right'
  }
  if (options.verticalAlign === 'top') {
    verticalOpposite = 'bottom'
  } else if (options.verticalAlign === 'bottom') {
    verticalOpposite = 'top'
  } else {
    verticalOpposite = 'bottom'
  }

  return { horizontalAlign: horizontalOpposite, verticalAlign: verticalOpposite }
}
