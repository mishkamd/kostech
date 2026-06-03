import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvPut } from '~~/server/utils/storage'
import { LeadUpdateSchema } from '~~/server/utils/validation'
import { notifyEvent } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const body = await readBody(event)
  const parsed = LeadUpdateSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })
  const current = await kvGet(event, `lead:${id}`)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
  const previousStatus = String((current as { status?: string }).status ?? '')
  const updated = { ...current, ...parsed.data }
  await kvPut(event, `lead:${id}`, updated)

  // Only notify on actual status changes (not on name/email edits).
  if (parsed.data.status && parsed.data.status !== previousStatus) {
    await notifyEvent(event, 'lead.status_changed', updated, previousStatus).catch(() => {})
  }

  return updated
})
