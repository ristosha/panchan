import { type SKRSContext2D } from '@napi-rs/canvas'
import GraphemeSplitter from 'grapheme-splitter'

import { fallbackFonts } from '~/api/resources.js'
import { type TextOptions } from '~/api/schema/text.js'

const fallback = fallbackFonts.join(',')

// export function textToLines (ctx: SKRSContext2D, text: string, maxWidth: number) {
//   const lines = [] as string[]
//   const paragraphs = text.split('\n')
//   for (const paragraph of paragraphs) {
//     const words = paragraph.split(' ')
//     let line = ''
//     for (const word of words) {
//       const { width } = ctx.measureText(line + ' ' + word)
//       if (width > maxWidth) {
//         lines.push(line)
//         line = word
//       } else if (line.length > 0) {
//         line += ' ' + word
//       } else {
//         line = word
//       }
//     }
//
//     // breaks paragraph
//     if (line.length > 0) lines.push(line)
//   }
//   return lines
// }

const splitter = new GraphemeSplitter()

function isEmoji (char: string) {
  return char.match(/(?=\p{Emoji})(?!\p{Number})/u) != null
}

export function textToLines (ctx: SKRSContext2D, text: string, maxWidth: number, maxLines = Infinity): string[] {
  const lines = [] as string[]
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    const chars = splitter.splitGraphemes(paragraph)
    let line = [] as string[]
    let word = ''
    for (const char of chars) {
      const emoji = isEmoji(char)
      if (char === ' ' || emoji) {
        const testWord = word + (emoji ? char : '')
        const testLine = line.concat(testWord)
        const { width } = ctx.measureText(testLine.join(' '))
        if (width > maxWidth) {
          lines.push(line.join(' '))
          line = [testWord]
        } else {
          line.push(testWord)
        }
        word = ''
      } else {
        word += char
      }
    }

    if (word.length > 0) line.push(word)
    if (line.length > 0) lines.push(line.join(' '))
  }

  return lines.length > maxLines ? lines.slice(0, maxLines) : lines
}

interface FitTextOptions {
  maxHeight: number
  maxWidth: number
  fontSizeMax: number
  fontSizeMin: number
  fontStyle: string
  textWrap: boolean
  maxLines?: number
  lineHeight?: number
}

function getTextStats (ctx: SKRSContext2D, lines: string[], lineHeight = 1) {
  const measure = lines.map(l => ctx.measureText(l))

  return {
    width: Math.max(...measure.map(l => l.width)),
    height: parseInt(ctx.font) * lines.length + lineHeight * (lines.length - 1)
  }
}

export function fitText (
  ctx: SKRSContext2D,
  text: string,
  params: FitTextOptions
) {
  const {
    fontSizeMin,
    maxHeight,
    maxWidth,
    fontStyle,
    lineHeight,
    maxLines, textWrap
  } = params

  let { fontSizeMax } = params
  if (fontSizeMax === -1) fontSizeMax = maxWidth / 5

  let fontSize = (fontSizeMin + fontSizeMax) / 2
  let lines: string[] = []
  let width: number = 0
  let height: number = 0

  function update () {
    ctx.font = `${fontSize}px ${fontStyle}`
    lines = textWrap ? textToLines(ctx, text, maxWidth, maxLines) : text.split('\n');
    ({ width, height } = getTextStats(ctx, lines, lineHeight ?? 1))
  }

  update()
  while (width > maxWidth && fontSize > fontSizeMin) {
    fontSize -= 1
    update()
  }

  if (width > maxWidth || height > maxHeight) {
    while ((width > maxWidth || height > maxHeight) && fontSize > fontSizeMin) {
      fontSize -= 1
      update()
    }
  }

  return { fontSize, width, height, lines }
}

export function multiline (ctx: SKRSContext2D, text: string, opts: TextOptions) {
  if (opts.yMax === -1) opts.yMax = ctx.canvas.height
  if (opts.xMax === -1) opts.xMax = ctx.canvas.width

  const maxHeight = opts.yMax - opts.yMin
  const maxWidth = opts.xMax - opts.xMin
  const fitConfig: FitTextOptions = {
    maxWidth,
    maxHeight,
    ...opts,
    fontStyle: [opts.fontStyle, opts.emojiStyle, fallback].join(',')
  }
  const { width, height, fontSize, lines } = fitText(ctx, text, fitConfig)

  ctx.font = `${fontSize} ${opts.fontStyle},${opts.emojiStyle},${fallback}`
  ctx.strokeStyle = opts.strokeStyle
  ctx.textAlign = 'left'
  ctx.textBaseline = opts.verticalAlign === 'center' ? 'middle' : 'top'

  let y = opts.yMin
  switch (opts.verticalAlign) {
    case 'top':
      break
    case 'center':
      y += (maxHeight - height) / 2 + (opts.verticalAlign === 'center' ? fontSize / 2 : 0)
      break
    case 'bottom':
      y += maxHeight - height - fontSize / 2
      break
  }

  const drawQueue: Array<{ x: number, y: number, line: string }> = []

  for (const [index, line] of lines.entries()) {
    const lineWidth = ctx.measureText(line).width

    let x = opts.xMin
    switch (opts.horizontalAlign) {
      case 'left':
        break
      case 'center':
        x += (maxWidth - width) / 2
        break
      case 'right':
        x += maxWidth - width
        break
    }

    switch (opts.textAlign) {
      case 'left':
        break
      case 'center':
        x += (width - lineWidth) / 2
        break
      case 'right':
        x += width - lineWidth
        break
    }

    drawQueue.push({ line, x, y: y + index * (fontSize * opts.lineHeight) })
  }

  if (opts.fontColor.startsWith('gradient')) {
    const match = opts.fontColor.match(/gradient\((.+)\)/)
    if (match != null) {
      let topX = Infinity
      let topY = Infinity
      let botX = -Infinity
      let botY = -Infinity

      drawQueue.forEach(({ x, y, line }) => {
        const lineWidth = ctx.measureText(line).width
        const lineHeight = fontSize * opts.lineHeight
        topX = Math.min(topX, x)
        topY = Math.min(topY, y)
        botX = Math.max(botX, x + lineWidth)
        botY = Math.max(botY, y + lineHeight)
      })

      const colors = match[1].split(',').map(color => color.trim())
      const gradient = ctx.createLinearGradient(topX, topY, botX, botY)

      colors.forEach((color, index) => {
        const colorStop = index / (colors.length - 1)
        gradient.addColorStop(colorStop, color)
      })

      ctx.fillStyle = gradient
    }
  } else {
    ctx.fillStyle = opts.fontColor
  }

  drawQueue.forEach(l => {
    const x = l.x - opts.marginLeft + opts.marginRight
    const y = l.y - opts.marginTop + opts.marginBottom
    ctx.fillText(l.line, x, y)

    if (opts.strokeWidth !== 0) {
      ctx.strokeText(l.line, x, y)
    }
  })
}
