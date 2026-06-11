import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvPut, kvListCacheDelete } from '~~/server/utils/storage'
import { BookingUpdateSchema } from '~~/server/utils/validation'
import { notifyEvent } from '~~/server/utils/notifications'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'
import { getD1, d1GetBooking, d1UpdateBooking } from '~~/server/utils/d1'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const body = await readBody(event)
  const parsed = BookingUpdateSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })

  const db = getD1(event)
  let updated: Record<string, unknown>

  if (db) {
    const current = await d1GetBooking(db, id)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const previousStatus = current.status
    await d1UpdateBooking(db, id, parsed.data)
    updated = { ...current, ...parsed.data, updatedAt: Date.now() }
    await kvListCacheDelete(event, 'booking:__list__')

    if (parsed.data.status && parsed.data.status !== previousStatus) {
      await notifyEvent(event, 'booking.status_changed', updated, previousStatus).catch(() => {})
    }
  }
  else {
    // Dev fallback
    const current = await kvGet(event, `booking:${id}`)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const previousStatus = String((current as { status?: string }).status ?? '')
    updated = { ...current, ...parsed.data }
    await kvPut(event, `booking:${id}`, updated)

    if (updated.status !== previousStatus) {
      await notifyEvent(event, 'booking.status_changed', updated, previousStatus).catch(() => {})
    }
  }

  kvCacheInvalidate('booking:')
  return updated
})
