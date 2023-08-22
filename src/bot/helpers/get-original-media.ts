import { basename } from 'path'

import { getMediaChain, getMediaChainById } from '~/bot/helpers/media-chain.js'
import { type MyContext } from '~/bot/types/context.js'
import { config } from '~/config.js'
import { storage } from '~/storage.js'

export async function getOriginalMediaByCtx (ctx: MyContext) {
  const {
    file_path: path = '',
    file_unique_id: resultFileUniqueId
  } = await ctx.getFile()

  const filename = basename(path)

  let publicId: string | undefined
  if (filename.startsWith(config.BOT_FILE_PREFIX)) {
    publicId = filename
      .slice(config.BOT_FILE_PREFIX.length)
      .split('.')
      .at(1)
  }

  const found = await storage.generatedMedia.findFirst({
    where: {
      OR: [
        { resultFileUniqueId },
        { publicId }
      ]
    },
    select: {
      type: true,
      mime: true,
      sourceFileId: true,
      createdAt: true,
      author: {
        select: { username: true, anonymous: true }
      },
      _count: {
        select: { uses: true }
      }
    }
  })

  if (found == null) return undefined

  const chain = await getMediaChain(found.sourceFileId)
  return chain
}

export async function getOriginalMediaById (id: number) {
  // const found = await storage.generatedMedia.findFirst({
  //   where: { id }
  // })
  //
  // if (found == null) {
  //   return undefined
  // }

  const chain = await getMediaChainById(id)
  return chain
}
