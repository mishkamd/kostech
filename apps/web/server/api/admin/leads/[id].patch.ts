import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvPut, kvListCacheDelete } from '~~/server/utils/storage'
import { LeadUpdateSchema } from '~~/server/utils/validation'
import { notifyEvent } from '~~/server/utils/notifications'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'
import { getD1, d1GetLead, d1UpdateLead } from '~~/server/utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const body = await readBody(event)
  const parsed = LeadUpdateSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })

  const db = getD1(event)
  let updated: Record<string, unknown>

  if (db) {
    const current = await d1GetLead(db, id)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const previousStatus = current.status
    await d1UpdateLead(db, id, { ...parsed.data, scheduledAt: parsed.data.scheduledAt })
    updated = { ...current, ...parsed.data, updatedAt: Date.now() }
    await kvListCacheDelete(event, 'lead:__list__')

    if (parsed.data.status && parsed.data.status !== previousStatus) {
      await notifyEvent(event, 'lead.status_changed', updated, previousStatus).catch(() => {})
    }
  }
  else {
    const current = await kvGet(event, `lead:${id}`)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const previousStatus = String((current as { status?: string }).status ?? '')
    updated = { ...current, ...parsed.data }
    await kvPut(event, `lead:${id}`, updated)

    if (parsed.data.status && parsed.data.status !== previousStatus) {
      await notifyEvent(event, 'lead.status_changed', updated, previousStatus).catch(() => {})
    }
  }

  kvCacheInvalidate('lead:')
  return updated
})
