import { type TextOptions } from '~/api/schema/text.js'

export const textDefaults: TextOptions = {
  xMin: 0,
  xMax: -1,
  yMin: 0,
  yMax: -1,
  marginLeft: 10,
  marginTop: 10,
  marginRight: 10,
  marginBottom: 10,
  emojiStyle: 'apple',
  fontStyle: 'lobster',
  fontSizeMin: 10,
  fontSizeMax: 60,
  textWrap: true,
  fontColor: 'white',
  maxLines: Infinity,
  textAlign: 'center',
  verticalAlign: 'bottom',
  horizontalAlign: 'center',
  lineHeight: 1.2,
  strokeStyle: 'black',
  strokeWidth: 0
}

export const demotivatorDefaults: TextOptions = {
  xMax: 409, // 382 (content width) + 27 (black border),
  xMin: 27, // (black border),
  yMin: 409, // 382 (content width) + 27 (black border),
  yMax: 506, // max height - 6 px padding,
  fontSizeMin: 8, // 16,
  fontSizeMax: 65,
  fontColor: 'white',
  textAlign: 'center',
  verticalAlign: 'center',
  horizontalAlign: 'center',
  fontStyle: 'times',
  emojiStyle: 'apple',
  lineHeight: 1.1,
  marginRight: 0,
  marginTop: 0,
  marginLeft: 0,
  marginBottom: 0,
  textWrap: true,
  maxLines: 6, // 3,
  strokeWidth: 0,
  strokeStyle: 'black'
}
