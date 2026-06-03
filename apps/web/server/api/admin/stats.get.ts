import { requireAdmin } from '~~/server/utils/auth'
import { kvList } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const [leads, bookings] = await Promise.all([
    kvList(event, 'lead:'),
    kvList(event, 'booking:'),
  ])
  const since = Date.now() - 24 * 60 * 60 * 1000
  const newToday =
    leads.filter((l: any) => (l.createdAt ?? 0) >= since).length +
    bookings.filter((b: any) => (b.createdAt ?? 0) >= since).length
  return { leads: leads.length, bookings: bookings.length, newToday }
})
