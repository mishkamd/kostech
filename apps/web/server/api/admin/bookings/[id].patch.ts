import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvPut } from '~~/server/utils/storage'
import { BookingUpdateSchema } from '~~/server/utils/validation'
import { notifyEvent } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const body = await readBody(event)
  const parsed = BookingUpdateSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Date invalide' })
  const current = await kvGet(event, `booking:${id}`)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
  const previousStatus = String((current as { status?: string }).status ?? '')
  const updated = { ...current, ...parsed.data }
  await kvPut(event, `booking:${id}`, updated)

  if (updated.status !== previousStatus) {
    await notifyEvent(event, 'booking.status_changed', updated, previousStatus).catch(() => {})
  }

  return updated
})
