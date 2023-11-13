import { Composer, matchFilter } from 'grammy'

import { rateLimit } from '~/bot/commands/utils/rate-limit.js'
import { extractMediaExtended } from '~/bot/helpers/extractors.js'
import getRandomElement from '~/bot/helpers/get-random-element.js'
import { parseArgs } from '~/bot/helpers/parse-args.js'
import { bot } from '~/bot/index.js'
import autoQuote from '~/bot/middlewares/auto-quote.js'
import { type MyContext } from '~/bot/types/context.js'

export const randomDemotivator = new Composer<MyContext>()
const command = randomDemotivator.command(['rdem', 'rdemotivator', 'рдем', 'рандом'])

command.use(rateLimit)
command.use(autoQuote())
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
    const parsed = parseArgs(textContent ?? '')

    const randomElements: number[] = []
    if (textContent == null || textContent.length === 0 || parsed._.length === 0) {
      const random = await getRandomElement('titles', chatId)
      if (random != null) {
        randomElements.push(random.id)
      }

      textContent = random?.content
    }

    if (textContent == null || textContent.length === 0) {
      await ctx.reply(ctx.t('command-random.no-text'))
      return
    }

    const update = Object.create(ctx.update)
    const outContent = [textContent]
    if (parsed._.length === 0) outContent.push(ctx.match)
    if (randomElements.length > 0) outContent.push('~+*$33:' + randomElements.join(':') + '%')

    update.message.text = `/dem ${outContent.join(' ')}`

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
  const parsed = parseArgs(textContent ?? '')

  const randomElements: number[] = []
  if (textContent == null || textContent.length === 0 || parsed._.length === 0) {
    const random = await getRandomElement('titles', chatId)
    if (random != null) {
      randomElements.push(random.id)
    }

    textContent = random?.content
  }

  if (textContent == null || textContent.length === 0) {
    await ctx.reply(ctx.t('command-random.no-text'))
    return
  }

  const mediaContent = await getRandomElement('media', chatId)
  if (mediaContent == null) {
    await ctx.reply(ctx.t('command-random.no-media'))
    return
  }

  randomElements.push(mediaContent.id)

  const update = Object.create(ctx.update)
  const outContent = [textContent]
  if (parsed._.length === 0) outContent.push(ctx.match)
  if (randomElements.length > 0) outContent.push('~+*$33:' + randomElements.join(':') + '%')

  update.message.text = `/dem ${outContent.join(' ')}`

  const { type, content } = mediaContent
  const fakeFile = await ctx.api.getFile(content)
  if (type === 'PHOTO') {
    update.message.photo = [fakeFile]
  } else {
    update.message[type.toLowerCase()] = fakeFile
  }

  await bot.handleUpdate(update)
})
