import fs from '@supercharge/fs'

import { getAsyncId } from '~/api/id.js'
import { parseArgsInMessage } from '~/bot/helpers/parse-args.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'

export async function prepareMedia (ctx: MyContext, fileFormat: 'png' | 'mp4' | 'webm') {
  const [file, id, user] = await Promise.all([ctx.getFile(), getAsyncId(), ctx.state.user()])
  const inputFile = await file.download()

  const opts = parseArgsInMessage(ctx)
  const text = opts._ ?? ''

  const { premium = false } = user
  const watermark = !premium
  const fileName = `${config.BOT_FILE_PREFIX}${id}.${fileFormat}`
  return { file, inputFile, text, id, fileName, watermark, opts, sourceFileId: file.file_id }
}

export async function prepareMediaWithOutput (ctx: MyContext, fileFormat: 'png' | 'mp4' | 'webm') {
  const result = await prepareMedia(ctx, fileFormat)
  const outputFile = await fs.tempFile(result.fileName)
  return { ...result, outputFile }
}
