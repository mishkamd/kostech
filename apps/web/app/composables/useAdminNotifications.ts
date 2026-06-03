import { useIntervalFn } from '@vueuse/core'
import { useToast } from './useToast'

export interface AdminNotificationItem {
  id: string
  name?: string
  email?: string
  phone?: string
  message?: string
  description?: string
  serviceSlug?: string
  date?: string
  status?: string
  source?: string
  createdAt: number
}

export interface AdminNotificationsPayload {
  count: number
  lastReadAt: number
  latest: {
    leads: AdminNotificationItem[]
    bookings: AdminNotificationItem[]
  }
}

/**
 * Polls `/api/admin/notifications/count` on a 20s interval while the admin
 * is signed in. Emits a toast for any brand-new item that appeared between
 * polls. Returns the latest payload + a `markRead` action.
 *
 * The composable is mounted exactly once via `<AdminNotificationsBell />`,
 * which is rendered from `layouts/admin.vue`.
 */
const POLL_INTERVAL_MS = 20_000

let _instance: ReturnType<typeof create> | null = null

function create() {
  const payload = ref<AdminNotificationsPayload | null>(null)
  const loading = ref(false)
  const error = ref<string>('')

  // IDs we have already seen, so we only toast for genuinely new items.
  const seenIds = new Set<string>()

  let primed = false

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      const next = await $fetch<AdminNotificationsPayload>('/api/admin/notifications/count')
      // First successful load just initialises the seen-set, no toasts.
      if (!primed) {
        for (const l of next.latest.leads) seenIds.add('lead:' + l.id)
        for (const b of next.latest.bookings) seenIds.add('book:' + b.id)
        primed = true
      } else {
        const toast = useToast()
        for (const l of next.latest.leads) {
          const k = 'lead:' + l.id
          if (!seenIds.has(k)) {
            seenIds.add(k)
            toast.push({
              kind: 'lead',
              title: 'Lead nou',
              body: l.name || '—',
              href: '/admin/leads',
              ttl: 6000,
            })
          }
        }
        for (const b of next.latest.bookings) {
          const k = 'book:' + b.id
          if (!seenIds.has(k)) {
            seenIds.add(k)
            toast.push({
              kind: 'booking',
              title: 'Programare nouă',
              body: `${b.name || '—'} • ${b.serviceSlug || ''} • ${b.date || ''}`,
              href: '/admin/leads',
              ttl: 6000,
            })
          }
        }
      }
      payload.value = next
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Eroare'
    } finally {
      loading.value = false
    }
  }

  async function markRead() {
    try {
      await $fetch('/api/admin/notifications/mark-read', { method: 'POST' })
      await refresh()
    } catch {
      // ignore — next poll will recover
    }
  }

  const interval = useIntervalFn(refresh, POLL_INTERVAL_MS, {
    immediate: true,
    immediateCallback: true,
  })

  return {
    payload,
    loading,
    error,
    refresh,
    markRead,
    pause: interval.pause,
    resume: interval.resume,
  }
}

export function useAdminNotifications() {
  if (!_instance) _instance = create()
  return _instance
}
