import { ContactSchema } from '~~/server/utils/validation'
import { kvPut, kvListCacheDelete, newId } from '~~/server/utils/storage'
import { notifyEvent } from '~~/server/utils/notifications'
import { getD1, d1InsertLead } from '~~/server/utils/d1'
import { r2PutAttachment } from '~~/server/utils/r2'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }

  const id = newId('lead')
  const now = Date.now()

  const attachmentMeta: Array<{ name: string; type: string; size: number }> = []
  const r2Keys: string[] = []
  for (const [i, att] of (parsed.data.attachments ?? []).entries()) {
    const key = `leads/${id}/${i}_${att.name}`
    const buf = Buffer.from(att.data, 'base64')
    await r2PutAttachment(event, key, buf.buffer as ArrayBuffer, att.type)
    r2Keys.push(key)
    attachmentMeta.push({ name: att.name, type: att.type, size: att.size })
  }

  const record = {
    id,
    name: parsed.data.name,
    email: parsed.data.email ?? '',
    phone: parsed.data.phone ?? '',
    message: parsed.data.message ?? '',
    description: parsed.data.description ?? '',
    location: parsed.data.location ?? '',
    scheduledAt: parsed.data.scheduledAt ?? '',
    source: parsed.data.source ?? '',
    status: 'new' as const,
    createdAt: now,
    ...(attachmentMeta.length ? { attachments: attachmentMeta } : {}),
  }

  const db = getD1(event)
  if (db) {
    await d1InsertLead(db, record, r2Keys)
    await kvListCacheDelete(event, 'lead:__list__')
  }
  else {
    const kvRecord = {
      ...record,
      ...(parsed.data.attachments?.length ? { attachments: parsed.data.attachments } : {}),
    }
    await kvPut(event, `lead:${id}`, kvRecord as Record<string, unknown>)
  }

  kvCacheInvalidate('lead:')

  await notifyEvent(event, 'lead.created', record).catch(() => {})
  return { ok: true, id }
})
