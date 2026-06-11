import { BookingSchema } from '~~/server/utils/validation'
import { kvPut, kvListCacheDelete, newId } from '~~/server/utils/storage'
import { notifyEvent } from '~~/server/utils/notifications'
import { getD1, d1InsertBooking } from '~~/server/utils/d1'
import { r2PutAttachment } from '~~/server/utils/r2'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = BookingSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }

  const id = newId('book')
  const now = Date.now()

  // Upload attachments to R2; strip base64 from stored record
  const attachmentMeta: Array<{ name: string; type: string; size: number }> = []
  const r2Keys: string[] = []
  for (const [i, att] of (parsed.data.attachments ?? []).entries()) {
    const key = `bookings/${id}/${i}_${att.name}`
    const buf = Buffer.from(att.data, 'base64')
    await r2PutAttachment(event, key, buf.buffer as ArrayBuffer, att.type)
    r2Keys.push(key)
    attachmentMeta.push({ name: att.name, type: att.type, size: att.size })
  }

  const record = {
    id,
    serviceSlug: parsed.data.serviceSlug,
    date: parsed.data.date,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email ?? '',
    address: parsed.data.address ?? '',
    notes: parsed.data.notes ?? '',
    status: 'new' as const,
    createdAt: now,
    ...(attachmentMeta.length ? { attachments: attachmentMeta } : {}),
  }

  const db = getD1(event)
  if (db) {
    // Production: D1 source of truth, invalidate KV list cache
    await d1InsertBooking(db, record, r2Keys)
    await kvListCacheDelete(event, 'booking:__list__')
  }
  else {
    // Dev fallback: KV with full base64 attachments (no R2)
    const kvRecord = {
      ...record,
      ...(parsed.data.attachments?.length ? { attachments: parsed.data.attachments } : {}),
    }
    await kvPut(event, `booking:${id}`, kvRecord as Record<string, unknown>)
  }

  kvCacheInvalidate('booking:')

  await notifyEvent(event, 'booking.created', record).catch(() => {})
  return { ok: true, id }
})
