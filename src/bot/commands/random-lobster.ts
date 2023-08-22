import { Composer, matchFilter } from 'grammy'

import { extractMediaExtended } from '~/bot/helpers/extractors.js'
import getRandomElement from '~/bot/helpers/get-random-element.js'
import { bot } from '~/bot/index.js'
import { type MyContext } from '~/bot/types/context.js'

export const randomLobster = new Composer<MyContext>()
const command = randomLobster.command(['rlobster', 'rtext', 'рлобстер'])

command.on(
  [
    'msg:animation',
    'msg:photo',
    'msg:video',
    'msg:sticker',
    'msg:video_note'
  ])
  .drop(matchFilter(['msg:sticker:is_animated', 'msg:sticker:premium_animation']))
  .use(async ctx => {
    const chatId = (await ctx.state.chat?.())?.id ?? undefined

    let textContent: string | undefined = ctx.match
    if (textContent == null || textContent.length === 0) {
      textContent = (await getRandomElement('titles', chatId))?.content
    }

    if (textContent == null || textContent.length === 0) {
      await ctx.reply(ctx.t('command-random.no-text'))
      return
    }

    const update = Object.create(ctx.update)
    update.message.text = `/lobster ${textContent}`

    const { fileId, uniqueFileId, type, isVideo } = extractMediaExtended(ctx)
    const fakeFile: any = {
      file_id: fileId,
      unique_file_id: uniqueFileId
    }

    if (isVideo != null) {
      fakeFile.is_video = isVideo
    }

    if (type === 'PHOTO') {
      update.message.photo = [fakeFile]
    } else {
      update.message[type.toLowerCase()] = fakeFile
    }

    await bot.handleUpdate(update)
  })

command.on('msg', async (ctx) => {
  const chatId = (await ctx.state.chat?.())?.id ?? undefined

  let textContent: string | undefined = ctx.match
  if (textContent == null || textContent.length === 0) {
    textContent = (await getRandomElement('titles', chatId))?.content
  }

  if (textContent == null || textContent.length === 0) {
    await ctx.reply(ctx.t('command-random.no-text'))
    return
  }

  const update = Object.create(ctx.update)
  update.message.text = `/lobster ${textContent}`

  const mediaContent = await getRandomElement('media', chatId)
  if (mediaContent == null) {
    await ctx.reply(ctx.t('command-random.no-media'))
    return
  }

  const { type, content } = mediaContent
  const fakeFile = await ctx.api.getFile(content)
  if (type === 'PHOTO') {
    update.message.photo = [fakeFile]
  } else {
    update.message[type.toLowerCase()] = fakeFile
  }

  await bot.handleUpdate(update)
})
