import { keyValueAliases, type KeyValueAliasMap } from 'alias-mapper'

import { type TextOptions } from '~/api/schema/text.js'

export const textParamsMap: KeyValueAliasMap<TextOptions> = {
  xMax: {
    _aliases: ['x-maximum', 'x-max', 'xmax', 'икс-максимум', 'икс-макс'],
    _castTo: 'number'
  },
  xMin: {
    _aliases: ['x-minimum', 'x-min', 'xmin', 'икс-минимум', 'икс-мин'],
    _castTo: 'number'
  },
  yMax: {
    _aliases: ['x-maximum', 'x-max', 'xmax', 'игрек-максмум', 'икс-макс'],
    _castTo: 'number'
  },
  yMin: {
    _aliases: ['y-minimum', 'y-min', 'ymin', 'игрек-минимум', 'игрек-мин'],
    _castTo: 'number'
  },
  fontSizeMax: {
    _aliases: ['fontsize-maximum', 'fs-max', 'fsmax', 'макс-размер', 'максраз'],
    _castTo: 'number'
  },
  fontSizeMin: {
    _aliases: ['fontsize-minimum', 'fs-min', 'fsmin', 'мин-размер', 'минраз'],
    _castTo: 'number'
  },
  lineHeight: {
    _aliases: ['fontheight', 'font-height', 'fh', 'line-height', 'lineheight', 'lh', 'высота-строки', 'высстр'],
    _castTo: 'number'
  },
  video: {
    _aliases: ['audio'],
    _castTo: 'boolean',
    true: ['yes', 'on', 'да', 't', 'y'],
    false: ['no', 'off', 'нет', 'f', 'n']
  },
  emojiStyle: {
    _aliases: ['emoji']
  },
  textWrap: {
    _aliases: ['fit', 'подгонка', 'подгон', 'переносить'],
    _castTo: 'boolean',
    true: ['yes', 'on', 'да', 't', 'y'],
    false: ['no', 'off', 'нет', 'f', 'n']
  },
  fontStyle: {
    _aliases: ['font', 'шрифт', 'f'],
    lobster: ['лосбтер', 'краб'],
    times: ['times-new-roman', 'таймс'],
    arial: ['ариал', 'эриал']
  },
  verticalAlign: {
    _aliases: ['vertical-align', 'v-align', 'valign', 'va', 'по-вертикали'],
    top: ['t', 'up', 'верх', 'вверх', 'в'],
    center: ['middle', 'mid', 'm', 'cen', 'c', 'середина', 'с', 'центр', 'ц'],
    bottom: ['b', 'down', 'низ', 'вниз', 'жопа']
  },
  horizontalAlign: {
    _aliases: ['horizontal-align', 'h-align', 'halign', 'ha', 'по-горизонтали'],
    left: ['l', 'по-левому-краю', 'влево', 'лево', 'л'],
    center: ['middle', 'mid', 'm', 'cen', 'c', 'середина', 'с', 'центр', 'ц'],
    right: ['r', 'право', 'вправо', 'п']
  },
  textAlign: {
    _aliases: ['font-align', 'text-align', 'f-align', 't-align', 'talign', 'falign', 'align', 'выравнивание', 'выравн'],
    left: ['l', 'по-левому-краю', 'влево', 'лево', 'л'],
    center: ['middle', 'mid', 'm', 'cen', 'c', 'по-середине', 'середина', 'с', 'центр', 'ц'],
    right: ['r', 'по-правому-краю', 'вправо', 'право', 'п']
  },
  fontColor: {
    _aliases: ['color', 'c', 'цвет', 'ц'],
    white: ['белый', 'бел'],
    black: ['чёрный', 'черный', 'черн'],
    gray: ['серый', 'сер'],
    red: ['красный', 'красн'],
    blue: ['синий', 'син'],
    green: ['зелёный', 'зеленый', 'зел'],
    pink: ['розовый', 'роз'],
    violet: ['фиолетовый', 'фиолет'],
    orange: ['оранжевый', 'оранж', 'апельсин', 'мандарин']
  }
}

export const textParams = keyValueAliases<TextOptions>(textParamsMap)
