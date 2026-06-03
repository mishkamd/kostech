import { ContactSchema } from '~~/server/utils/validation'
import { kvPut, newId } from '~~/server/utils/storage'
import { notifyEvent } from '~~/server/utils/notifications'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Date invalide', data: parsed.error.flatten() })
  }
  const id = newId('lead')
  const record = {
    id,
    ...parsed.data,
    status: 'new' as const,
    createdAt: Date.now(),
  }
  await kvPut(event, `lead:${id}`, record)

  // Fire-and-forget Telegram notification. Never blocks the user response.
  await notifyEvent(event, 'lead.created', record).catch(() => {})

  return { ok: true, id }
})
