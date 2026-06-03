import type { H3Event } from 'h3'
import { getSettings } from './settings'
import { sendTelegramMessage } from './telegram'

/**
 * High-level event names recognised by the admin notification system.
 * Each maps 1-to-1 to a boolean toggle in `settings.notifications`.
 */
export type NotificationEventName =
  | 'lead.created'
  | 'booking.created'
  | 'lead.status_changed'
  | 'booking.status_changed'

interface RecordLike {
  id?: string
  name?: string
  email?: string
  phone?: string
  message?: string
  description?: string
  location?: string
  address?: string
  notes?: string
  serviceSlug?: string
  date?: string
  status?: string
  source?: string
  scheduledAt?: string
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const format = (v: unknown, fallback = '—') => {
  if (v === undefined || v === null || v === '') return fallback
  return escapeHtml(String(v))
}

const truncate = (s: string, max = 400) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

/** Build the HTML body for a Telegram message. */
function formatMessage(event: NotificationEventName, rec: RecordLike, previousStatus?: string): string {
  const id = rec.id ?? '?'
  const name = format(rec.name)
  const phone = format(rec.phone)
  const email = format(rec.email, '')

  if (event === 'lead.created') {
    const msg = truncate(format(rec.message || rec.description, '(fără mesaj)'), 600)
    return [
      '✉️ <b>Lead nou</b>',
      `<b>Nume:</b> ${name}`,
      `<b>Tel:</b> ${phone}`,
      email ? `<b>Email:</b> ${email}` : '',
      `<b>Mesaj:</b> ${msg}`,
      rec.source ? `<b>Sursă:</b> ${format(rec.source)}` : '',
      `<i>#${escapeHtml(id)}</i>`,
    ].filter(Boolean).join('\n')
  }

  if (event === 'booking.created') {
    return [
      '📅 <b>Programare nouă</b>',
      `<b>Serviciu:</b> ${format(rec.serviceSlug)}`,
      `<b>Data:</b> ${format(rec.date)}`,
      `<b>Nume:</b> ${name}`,
      `<b>Tel:</b> ${phone}`,
      email ? `<b>Email:</b> ${email}` : '',
      rec.address ? `<b>Adresă:</b> ${format(rec.address)}` : '',
      rec.notes ? `<b>Note:</b> ${truncate(format(rec.notes), 300)}` : '',
      `<i>#${escapeHtml(id)}</i>`,
    ].filter(Boolean).join('\n')
  }

  if (event === 'lead.status_changed') {
    return [
      '🔄 <b>Lead — status schimbat</b>',
      `<b>Nume:</b> ${name}`,
      `<b>Status:</b> ${format(previousStatus)} → <b>${format(rec.status)}</b>`,
      `<i>#${escapeHtml(id)}</i>`,
    ].join('\n')
  }

  // booking.status_changed
  return [
    '🔄 <b>Programare — status schimbat</b>',
    `<b>Serviciu:</b> ${format(rec.serviceSlug)}`,
    `<b>Data:</b> ${format(rec.date)}`,
    `<b>Nume:</b> ${name}`,
    `<b>Status:</b> ${format(previousStatus)} → <b>${format(rec.status)}</b>`,
    `<i>#${escapeHtml(id)}</i>`,
  ].join('\n')
}

function toggleFor(event: NotificationEventName): keyof NonNullable<Awaited<ReturnType<typeof getSettings>>>['notifications'] {
  switch (event) {
    case 'lead.created': return 'leadCreated'
    case 'booking.created': return 'bookingCreated'
    case 'lead.status_changed': return 'leadStatusChanged'
    case 'booking.status_changed': return 'bookingStatusChanged'
  }
}

/**
 * Fire-and-forget wrapper used by the public POST/PATCH endpoints.
 * Reads admin settings, checks the right toggle, formats the message and
 * sends via Telegram. NEVER throws. Should be called as
 * `notifyEvent(event, 'lead.created', record).catch(() => {})`.
 */
export async function notifyEvent(
  event: H3Event,
  name: NotificationEventName,
  record: RecordLike,
  previousStatus?: string,
): Promise<void> {
  try {
    const settings = await getSettings(event)
    if (!settings.telegram?.enabled) return
    const token = settings.telegram?.botToken ?? ''
    const chatId = settings.telegram?.chatId ?? ''
    if (!token || !chatId) return
    const toggles = settings.notifications ?? {}
    const toggleKey = toggleFor(name)
    if (toggles[toggleKey] === false) return

    const text = formatMessage(name, record, previousStatus)
    const result = await sendTelegramMessage(token, chatId, text)
    if (!result.ok) {
      console.warn('[notify] telegram failed', name, result)
    }
  } catch (err) {
    console.warn('[notify] skipped', name, (err as Error).message)
  }
}
