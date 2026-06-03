import { BookingSchema } from '~~/server/utils/validation'
import { kvPut, newId } from '~~/server/utils/storage'
import { notifyEvent } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }
  const id = newId('book')
  const record = {
    id,
    ...parsed.data,
    status: 'new' as const,
    createdAt: Date.now(),
  }
  await kvPut(event, `booking:${id}`, record)

  // Fire-and-forget Telegram notification. Never blocks the user response.
  await notifyEvent(event, 'booking.created', record).catch(() => {})

  return { ok: true, id }
})
