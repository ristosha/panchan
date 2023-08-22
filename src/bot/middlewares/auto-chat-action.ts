import { type MiddlewareFn, type Transformer } from 'grammy'

type Method =
  | 'sendMessage'
  | 'sendPhoto'
  | 'sendVideo'
  | 'sendVoice'
  | 'sendDocument'
  | 'sendSticker'
  | 'sendLocation'
  | 'sendVideoNote'

type Action =
  | 'typing'
  | 'upload_photo'
  | 'upload_video'
  | 'upload_voice'
  | 'upload_document'
  | 'choose_sticker'
  | 'find_location'
  | 'upload_video_note'

const actionByMethod = new Map([
  ['sendMessage', 'typing'],
  ['sendPhoto', 'upload_photo'],
  ['sendVideo', 'upload_video'],
  ['sendVoice', 'upload_voice'],
  ['sendDocument', 'upload_document'],
  ['sendSticker', 'choose_sticker'],
  ['sendLocation', 'find_location'],
  ['sendVideoNote', 'upload_video_note']
])

const isChatActionRequired = (method: string): method is Method =>
  actionByMethod.has(method)

const getChatAction = (method: Method): Action =>
  actionByMethod.get(method) as Action

export function setAutoChatAction (): Transformer {
  return async (prev, method, payload, signal) => {
    let handle: ReturnType<typeof setTimeout> | undefined

    if (isChatActionRequired(method) && 'chat_id' in payload) {
      const sendAction = async (): Promise<void> => {
        try {
          await prev('sendChatAction', {
            chat_id: payload.chat_id as string | number,
            action: getChatAction(method)
          })
        } catch {
          clearInterval(handle)
        }
      }

      await sendAction()
      handle ??= setInterval(() => sendAction, 5000)
    }

    try {
      return await prev(method, payload, signal)
    } finally {
      clearInterval(handle)
    }
  }
}

export default function autoChatAction (): MiddlewareFn {
  return async (ctx, next) => {
    ctx.api.config.use(setAutoChatAction())
    await next()
  }
}
