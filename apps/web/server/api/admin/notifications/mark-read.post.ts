import { requireAdmin } from '~~/server/utils/auth'
import { getSettings, saveSettings } from '~~/server/utils/settings'

/**
 * POST /api/admin/notifications/mark-read
 * Stamps `lastReadAt = Date.now()` into the admin settings. Idempotent.
 * Returns the new `lastReadAt`.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const current = await getSettings(event)
  const next = { ...current, lastReadAt: Date.now() }
  await saveSettings(event, next)
  return { ok: true, lastReadAt: next.lastReadAt }
})
