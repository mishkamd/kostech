/**
 * Minimal Telegram Bot API client.
 *
 * The token is held in admin settings (KV) and passed in by the caller, so
 * there are no module-level secrets. Outbound `fetch` is bounded by an
 * AbortController to avoid holding a Worker isolate when Telegram is slow.
 */

export type TelegramSendResult =
  | { ok: true; status: number; messageId?: number }
  | { ok: false; status: number; errorCode?: number; description?: string; error: 'http' | 'abort' | 'network' }

export interface SendTelegramOptions {
  /** Optional override; defaults to 4000ms. */
  timeoutMs?: number
  /** parse_mode passed straight to Telegram. Defaults to 'HTML'. */
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown'
  /** Disable link previews; defaults to true to keep messages compact. */
  disableWebPagePreview?: boolean
}

const DEFAULT_TIMEOUT = 4000

/**
 * Send a single text message to a chat via the Bot API. NEVER throws — all
 * errors are captured and returned as `{ ok: false, ... }`. The caller can
 * log/ignore as needed.
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  opts: SendTelegramOptions = {},
): Promise<TelegramSendResult> {
  if (!botToken || !chatId || !text) {
    return { ok: false, status: 0, error: 'network', description: 'Missing token, chatId, or text' }
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: opts.parseMode ?? 'HTML',
        disable_web_page_preview: opts.disableWebPagePreview ?? true,
      }),
      signal: ctrl.signal,
    })

    let payload: { ok?: boolean; description?: string; error_code?: number; result?: { message_id?: number } } = {}
    try {
      payload = (await res.json()) as typeof payload
    } catch {
      // body wasn't JSON; fall through with empty payload
    }

    if (res.ok && payload.ok) {
      return { ok: true, status: res.status, messageId: payload.result?.message_id }
    }
    return {
      ok: false,
      status: res.status,
      errorCode: payload.error_code,
      description: payload.description || `Telegram responded with ${res.status}`,
      error: 'http',
    }
  } catch (err) {
    const e = err as Error
    if (e.name === 'AbortError') {
      return { ok: false, status: 0, error: 'abort', description: `Aborted after ${timeoutMs}ms` }
    }
    return { ok: false, status: 0, error: 'network', description: e.message }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Validate a token format without making a network call. Telegram tokens look
 * like `<digits>:<base64-url chars>`. The presence of `:` and a minimum length
 * is enough to filter out obvious typos before we hit the API.
 */
export function looksLikeTelegramToken(value: string): boolean {
  if (!value || value.length < 30) return false
  const m = /^\d{6,12}:[A-Za-z0-9_-]{20,}$/.exec(value)
  return Boolean(m)
}
