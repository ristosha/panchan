import fs from '@supercharge/fs'

import { getAsyncId } from '~/api/id.js'
import { parseArgsInMessage } from '~/bot/helpers/parse-args.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export async function prepareMedia (ctx: MyContext, fileFormat: 'png' | 'mp4' | 'webm') {
  const [file, id, user] = await Promise.all([ctx.getFile(), getAsyncId(), ctx.state.user()])
  const inputFile = await file.download()

  const opts = parseArgsInMessage(ctx)
  let text = opts._ ?? ''
  let randomElements: number[] = []
  if (text.includes('~+*$33') === true) {
    ({ extractedNumbers: randomElements, modifiedInput: text } = extractAndRemoveNumbers(text))
  }

  const { premium = false } = user
  const watermark = !premium
  const fileName = `${config.BOT_FILE_PREFIX}${id}.${fileFormat}`
  return { file, inputFile, text, id, fileName, watermark, opts, randomElements, sourceFileId: file.file_id }
}

export async function prepareMediaWithOutput (ctx: MyContext, fileFormat: 'png' | 'mp4' | 'webm') {
  const result = await prepareMedia(ctx, fileFormat)
  const outputFile = await fs.tempFile(result.fileName)
  return { ...result, outputFile }
}

function extractAndRemoveNumbers (input: string): { modifiedInput: string, extractedNumbers: number[] } {
  const pattern = /~\+\*\$33:(\d+)(?::(\d+))?%/
  const match = input.match(pattern)

  if (match == null) {
    return { modifiedInput: input, extractedNumbers: [] }
  }

  const [, firstNumber, secondNumber] = match
  const extractedNumbers: number[] = []

  if (firstNumber != null) {
    extractedNumbers.push(parseInt(firstNumber, 10))
  }

  if (secondNumber != null) {
    extractedNumbers.push(parseInt(secondNumber, 10))
  }

  const modifiedInput = input.replace(pattern, '')

  return { modifiedInput, extractedNumbers }
}
