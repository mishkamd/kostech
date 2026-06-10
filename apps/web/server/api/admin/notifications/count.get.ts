import { requireAdmin } from '~~/server/utils/auth'
import { getSettings } from '~~/server/utils/settings'
import { kvList } from '~~/server/utils/storage'

/**
 * GET /api/admin/notifications/count
 * Returns the unread count + the most recent unread leads/bookings.
 * "Unread" is derived from `status === 'new' && createdAt > lastReadAt`,
 * so we don't need to mutate the records themselves.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const settings = await getSettings(event)
  const lastReadAt = Number(settings.lastReadAt ?? 0)

  const since = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days

  const [leads, bookings] = await Promise.all([
    kvList(event, 'lead:'),
    kvList(event, 'booking:'),
  ])

  const isUnread = (x: { status?: string; createdAt?: number }) =>
    (x.status ?? 'new') === 'new' && (x.createdAt ?? 0) > lastReadAt

  // Unread counts drive the badge; these are the ones that get reset on markRead.
  const unreadLeads = (leads as Array<{ status?: string; createdAt?: number }>).filter(isUnread)
  const unreadBookings = (bookings as Array<{ status?: string; createdAt?: number }>).filter(isUnread)

  // For the dropdown list we want ALL recent items, not just unread ones,
  // so the user keeps seeing the latest activity even after opening the bell.
  const recentLeads = (leads as Array<{ createdAt?: number }>)
    .filter((l) => (l.createdAt ?? 0) > since)
  const recentBookings = (bookings as Array<{ createdAt?: number }>)
    .filter((b) => (b.createdAt ?? 0) > since)

  const sortDesc = (a: { createdAt?: number }, b: { createdAt?: number }) =>
    (b.createdAt ?? 0) - (a.createdAt ?? 0)

  // Strip attachment bodies to keep the response small.
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
