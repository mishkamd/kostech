import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvDelete, kvListCacheDelete } from '~~/server/utils/storage'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'
import { getD1, d1GetBooking, d1DeleteBooking } from '~~/server/utils/d1'
import { r2DeleteAttachments } from '~~/server/utils/r2'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })

  const db = getD1(event)

  if (db) {
    const current = await d1GetBooking(db, id)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const r2Keys = await d1DeleteBooking(db, id)
    await r2DeleteAttachments(event, r2Keys)
    await kvListCacheDelete(event, 'booking:__list__')
  }
  else {
    const current = await kvGet(event, `booking:${id}`)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    await kvDelete(event, `booking:${id}`)
  }

  kvCacheInvalidate('booking:')
  return { ok: true }
})
