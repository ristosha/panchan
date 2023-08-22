import { type CachedMap, type CompositeAliasMap, type KeyValueAliasMap, type MapWithCachedKeys } from 'alias-mapper'

import { textComposite, textParams } from '~/api/schema/text.js'
import { type MyContext } from '~/bot/types/context.js'

export type ParsedArgs =
  Record<string, string | number | boolean>
  & { _: string }

interface ParseArgsParams {
  composite?: MapWithCachedKeys<CompositeAliasMap>
  keyValue?: CachedMap<KeyValueAliasMap>
}

export function parseArgsInMessage (ctx: MyContext, opts: ParseArgsParams = {}) {
  const {
    composite = textComposite,
    keyValue = textParams
  } = opts

  const text = ctx.match != null
    ? typeof ctx.match === 'string'
      ? ctx.match
      : ctx.match?.at(-1)
    : ctx.msg?.text ??
    ctx.msg?.caption

  let args: Record<string, any> = parseArgs(text ?? '')

  if (composite != null) args = composite.build(args)
  if (keyValue != null) args = keyValue.build(args)

  return args
}

const argRegex = /(?:^|\s)(-\S*)/gm // /(?:\B|\s)(-\S+)/gm
export function parseArgs (input: string): ParsedArgs {
  const rawArgs = input.matchAll(argRegex) ?? []
  const text = input.replace(argRegex, '')
  const parsed: ParsedArgs = { _: text }

  for (const [, arg] of rawArgs) {
    const slicedArg = arg.slice(1)
    if (arg.includes('=')) {
      const [key, value] = slicedArg.split('=')
      parsed[key] = value
    } else {
      parsed[slicedArg] = true
    }
  }

  return parsed
}

// export function parseArgs (input: string): ParsedArgs {
//   // const args = input.trimEnd().split(/[\s\n]+/)
//   const args = input.match(/-\S+|\S+/g) ?? []
//   const parsed: ParsedArgs = { _: '' }
//
//   const text: string[] = []
//   let current = ''
//
//   for (const arg of args) {
//     if (arg.startsWith('--')) {
//       current = arg.slice(2)
//     } else if (arg.startsWith('-')) {
//       current = arg.slice(1)
//     } else {
//       text.push(arg)
//       continue
//     }
//
//     if (current.includes('=')) {
//       const [key, value] = current.split('=')
//       parsed[key] = value
//     } else {
//       parsed[current] = true
//     }
//   }
//
//   parsed._ = text.join(' ')
//
//   return parsed
// }
