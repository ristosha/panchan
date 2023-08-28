import { compositeAliases, type CompositeAliasMap } from 'alias-mapper'

import { type TextOptions } from '~/api/schema/text.js'

export const textCompositeMap: CompositeAliasMap<TextOptions> = {
  size: {
    _aliases: ['размер'],
    _compute: value => {
      if (typeof value !== 'string') return {}

      const values = value.split(':').map(Number)
      let [min, max] = values

      if (values.length === 1) {
        max = min
      }

      return { fontSizeMax: max, fontSizeMin: min }
    }
  },
  lgbt: {
    _aliases: ['пидорасы', 'пидорас', 'rainbow'],
    fontColor: 'gradient(red,orange,yellow,green,blue,purple)',
    strokeWidth: 0
  },
  border: {
    _aliases: ['stroke', 'обводка'],
    _compute: value => {
      if (typeof value !== 'string') return {}

      const values = value.split(':')
      let [rawWidth, color] = values
      let width = Number(rawWidth)
      if (values.length === 1) {
        if (isNaN(width)) {
          width = 1
        }

        color = 'black'
      }
      return { strokeWidth: width, strokeStyle: color }
    }
  },
  gradient: {
    _aliases: ['градиент'],
    _compute: value => {
      if (typeof value !== 'string') return {}

      const colors = value.split(':')
      return { fontColor: `gradient(${colors.join(',')})` }
    }
  },
  margin: {
    _aliases: ['m', 'отступ'],
    _compute: value => {
      if (typeof value !== 'string') return {}
      const values = value.split(':').map(Number)
      let [marginTop, marginRight, marginBottom, marginLeft] = values
      if (values.length === 1) {
        marginRight = marginLeft = marginBottom = marginTop
      } else if (values.length === 2) {
        marginLeft = marginRight
        marginBottom = marginTop
      }
      return { marginTop, marginRight, marginBottom, marginLeft }
    }
  },
  'bottom-left': { _aliases: ['низ-лево', 'нижній-лівий'], verticalAlign: 'bottom', horizontalAlign: 'left' },
  'bottom-center': { _aliases: ['низ-центр', 'нижній-центр'], verticalAlign: 'bottom', horizontalAlign: 'center' },
  'bottom-right': { _aliases: ['низ-право', 'нижній-правий'], verticalAlign: 'bottom', horizontalAlign: 'right' },
  'center-left': { _aliases: ['центр-лево', 'центр-лівий'], verticalAlign: 'center', horizontalAlign: 'left' },
  'center-center': { _aliases: ['центр-центр', 'центр'], verticalAlign: 'center', horizontalAlign: 'center' },
  'center-right': { _aliases: ['центр-право', 'центр-правий'], verticalAlign: 'center', horizontalAlign: 'right' },
  'top-left': { _aliases: ['верх-лево', 'верхній-лівий'], verticalAlign: 'top', horizontalAlign: 'left' },
  'top-center': { _aliases: ['верх-центр', 'верхній-центр'], verticalAlign: 'top', horizontalAlign: 'center' },
  'top-right': { _aliases: ['верх-право', 'верхній-правий'], verticalAlign: 'top', horizontalAlign: 'right' }
}

export const textComposite = compositeAliases<TextOptions>(textCompositeMap)

export const resizeComposite = compositeAliases({
  size: {
    _aliases: ['resize', 'размер'],
    _compute: value => {
      if (typeof value !== 'string') return {}

      const values = value.split(':').map(Number)
      let [width, height] = values
      if (values.length === 1) {
        height = width
      }

      return { resize: { width, height } }
    }
  },
  scale: {
    _aliases: ['scale', 'масштаб'],
    _compute: value => {
      if (typeof value !== 'string') return {}

      const values = value.split(':').map(Number)
      let [width, height] = values
      if (values.length === 1) {
        height = width
      }

      return { scale: { width, height } }
    }
  }
})
