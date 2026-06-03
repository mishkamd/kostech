import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { getSettings } from '~~/server/utils/settings'
import { sendTelegramMessage } from '~~/server/utils/telegram'

const BodySchema = z
  .object({
    /** Optional override text. If omitted a default test string is used. */
    message: z.string().min(1).max(1000).optional(),
    /** Optional one-shot override of the chat id (otherwise the saved one is used). */
    chatId: z.string().min(1).max(64).optional(),
  })
  .strict()

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const raw = await readBody(event).catch(() => ({}))
  const parsed = BodySchema.safeParse(raw ?? {})
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }

  const settings = await getSettings(event)
  const botToken = settings.telegram?.botToken ?? ''
  const chatId = parsed.data.chatId || settings.telegram?.chatId || ''

  if (!botToken) {
    throw createError({ statusCode: 400, statusMessage: 'Bot token nu este configurat' })
  }
  if (!chatId) {
    throw createError({ statusCode: 400, statusMessage: 'Chat ID lipsește' })
  }

  const text = parsed.data.message
    || `✅ Kostech admin: mesaj de test la ${new Date().toISOString()}.`

  const result = await sendTelegramMessage(botToken, chatId, text)
  return { ok: result.ok, result }
})
