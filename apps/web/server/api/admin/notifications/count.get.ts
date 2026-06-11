import { requireAdmin } from '~~/server/utils/auth'
import { getSettings } from '~~/server/utils/settings'
import { kvList } from '~~/server/utils/storage'
import { kvCacheGet, kvCacheSet } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const settings = await getSettings(event)
  const lastReadAt = Number(settings.lastReadAt ?? 0)

  const since = Date.now() - 7 * 24 * 60 * 60 * 1000

  const [leads, bookings] = await Promise.all([
    Promise.resolve(kvCacheGet('lead:') ?? kvList(event, 'lead:').then(r => { kvCacheSet('lead:', r); return r })),
    Promise.resolve(kvCacheGet('booking:') ?? kvList(event, 'booking:').then(r => { kvCacheSet('booking:', r); return r })),
  ])

  const isUnread = (x: { status?: string; createdAt?: number }) =>
    (x.status ?? 'new') === 'new' && (x.createdAt ?? 0) > lastReadAt

  const unreadLeads = (leads as Array<{ status?: string; createdAt?: number }>).filter(isUnread)
  const unreadBookings = (bookings as Array<{ status?: string; createdAt?: number }>).filter(isUnread)

  const recentLeads = (leads as Array<{ createdAt?: number }>)
    .filter((l) => (l.createdAt ?? 0) > since)
  const recentBookings = (bookings as Array<{ createdAt?: number }>)
    .filter((b) => (b.createdAt ?? 0) > since)

  const sortDesc = (a: { createdAt?: number }, b: { createdAt?: number }) =>
    (b.createdAt ?? 0) - (a.createdAt ?? 0)

  const safe = (item: any) => {
    if (!item?.attachments?.length) return item
    return {
      ...item,
      attachments: item.attachments.map((a: any) => ({
        name: a.name, type: a.type, size: a.size,
      })),
    }
  }

  return {
    count: unreadLeads.length + unreadBookings.length,
    lastReadAt,
    latest: {
      leads: recentLeads.sort(sortDesc).slice(0, 3).map(safe),
      bookings: recentBookings.sort(sortDesc).slice(0, 3).map(safe),
    },
  }
})
