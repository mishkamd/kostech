import { requireAdmin } from '~~/server/utils/auth'
import { getSettings, sanitizeSettings } from '~~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const settings = await getSettings(event)
  return sanitizeSettings(settings)
})
