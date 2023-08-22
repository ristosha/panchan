import { type Context, type MiddlewareFn, type Transformer } from 'grammy'

export function addReplyParameter<C extends Context> (ctx: C): Transformer {
  return async (previous, method, payload, signal) => {
    if (
      !method.startsWith('send') ||
      method === 'sendChatAction' ||
      'reply_to_message_id' in payload
    ) {
      return await previous(method, payload, signal)
    }

    if (
      // @ts-expect-error wrong type detection
      (Boolean((payload).chat_id)) &&
      // @ts-expect-error WTD again
      (payload).chat_id === ctx.from?.id
    ) {
      return await previous(method, payload, signal)
    }

    return await previous(
      method,
      { ...payload, reply_to_message_id: ctx.msg?.message_id },
      signal
    )
  }
}

export default function autoQuote (): MiddlewareFn {
  return async (ctx, next) => {
    ctx.api.config.use(addReplyParameter(ctx))
    await next()
  }
}
