import { requireAdmin } from '~~/server/utils/auth'
import { kvList } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [leads, bookings] = await Promise.all([
    kvList(event, 'lead:'),
    kvList(event, 'booking:'),
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
