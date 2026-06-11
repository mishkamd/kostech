import { requireAdmin } from '~~/server/utils/auth'
import { kvList } from '~~/server/utils/storage'
import { kvCacheGet, kvCacheSet } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [leads, bookings] = await Promise.all([
    Promise.resolve(kvCacheGet('lead:') ?? kvList(event, 'lead:').then(r => { kvCacheSet('lead:', r); return r })),
    Promise.resolve(kvCacheGet('booking:') ?? kvList(event, 'booking:').then(r => { kvCacheSet('booking:', r); return r })),
  ])
  const since = Date.now() - 24 * 60 * 60 * 1000
  const newToday =
    leads.filter((l: any) => (l.createdAt ?? 0) >= since).length +
    bookings.filter((b: any) => (b.createdAt ?? 0) >= since).length

  const countByStatus = (arr: any[]) => ({
    new: arr.filter((x: any) => (x.status ?? 'new') === 'new').length,
    in_progress: arr.filter((x: any) => x.status === 'in_progress').length,
    done: arr.filter((x: any) => x.status === 'done').length,
    canceled: arr.filter((x: any) => x.status === 'canceled').length,
  })

  return {
    leads: leads.length,
    bookings: bookings.length,
    newToday,
    leadsByStatus: countByStatus(leads),
    bookingsByStatus: countByStatus(bookings),
  }
})
