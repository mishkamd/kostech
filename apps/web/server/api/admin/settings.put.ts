import { z } from 'zod'
import { requireAdmin } from '~~/server/utils/auth'
import { getSettings, saveSettings, sanitizeSettings, type Settings } from '~~/server/utils/settings'

/**
 * PUT /api/admin/settings
 * Body shape: a partial Settings object. `telegram.botToken` accepts either
 * a new plaintext token OR the redacted `'****'` marker to keep the existing
 * one. Sending `botToken: null` clears it.
 */
const PutBodySchema = z
  .object({
    telegram: z
      .object({
        botToken: z.union([z.string().min(1), z.null()]).optional(),
        chatId: z.string().max(64).optional(),
        enabled: z.boolean().optional(),
      })
      .optional(),
    notifications: z
      .object({
        leadCreated: z.boolean().optional(),
        bookingCreated: z.boolean().optional(),
        leadStatusChanged: z.boolean().optional(),
        bookingStatusChanged: z.boolean().optional(),
      })
      .optional(),
    lastReadAt: z.number().int().nonnegative().optional(),
  })
  .strict()

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody(event)
  const parsed = PutBodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }

  const current = await getSettings(event)
  const incoming = parsed.data
  const next: Settings = { ...current }

  if (incoming.telegram) {
    const currentTg = current.telegram ?? { botToken: '', chatId: '', enabled: false }
    const mergedTg = { ...currentTg }
    if (incoming.telegram.botToken !== undefined) {
      if (incoming.telegram.botToken === null) {
        mergedTg.botToken = ''
      } else if (incoming.telegram.botToken === '****') {
        // explicit no-op marker from the UI when the password field is left blank
      } else {
        mergedTg.botToken = incoming.telegram.botToken
      }
    }
    if (incoming.telegram.chatId !== undefined) mergedTg.chatId = incoming.telegram.chatId
    if (incoming.telegram.enabled !== undefined) mergedTg.enabled = incoming.telegram.enabled
    next.telegram = mergedTg
  }

  if (incoming.notifications) {
    next.notifications = { ...(current.notifications ?? {}), ...incoming.notifications }
  }

  if (incoming.lastReadAt !== undefined) {
    next.lastReadAt = incoming.lastReadAt
  }

  const saved = await saveSettings(event, next)
  return { ok: true, settings: sanitizeSettings(saved) }
})
