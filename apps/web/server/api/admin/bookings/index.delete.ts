import { requireAdmin } from '~~/server/utils/auth'
import { kvList, kvDelete } from '~~/server/utils/storage'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const bookings = await kvList(event, 'booking:') as any[]
  await Promise.all(bookings.map((b: any) => kvDelete(event, `booking:${b.id}`)))
  kvCacheInvalidate('booking:')
  return { ok: true, deleted: bookings.length }
})
