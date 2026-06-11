import { getSettings } from '~~/server/utils/settings'
import { sendTelegramMessage, sendWithKeyboard, answerCallbackQuery } from '~~/server/utils/telegram'
import { kvList, kvGet, kvPut } from '~~/server/utils/storage'

function esc(s: unknown) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmt(v: unknown, fallback = '—') {
  return v === null || v === undefined || v === '' ? fallback : esc(v)
}

function trunc(s: string, max = 300) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

const STATUS_LABEL: Record<string, string> = {
  new: '🆕 Nou',
  in_progress: '🔄 În lucru',
  done: '✅ Finalizat',
  canceled: '❌ Anulat',
}

const ALL_STATUSES = ['new', 'in_progress', 'done', 'canceled'] as const
type Status = typeof ALL_STATUSES[number]

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s
}

function dateShort(v: unknown) {
  if (!v) return '—'
  const d = new Date(Number(v) || String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Inline status buttons for a record — marks current status with ✓
function statusButtons(prefix: string, id: string, current: string) {
  return [ALL_STATUSES.map(s => ({
    text: s === current ? `${STATUS_LABEL[s]!} ✓` : STATUS_LABEL[s]!,
    callback_data: `${prefix}:${id}:${s}`,
  }))]
}

// ── Menu ──────────────────────────────────────────────────────────────────────

function mainMenuButtons(siteUrl: string) {
  return [
    [
      { text: '📋 Cereri recente', callback_data: 'leads' },
      { text: '📅 Programări recente', callback_data: 'bookings' },
    ],
    [{ text: '📊 Statistici', callback_data: 'stats' }],
    [{ text: '🌐 Deschide panoul admin', web_app: { url: `${siteUrl}/admin` } }],
  ]
}

const WELCOME_TEXT = `
👋 <b>Kostech Admin Bot</b>

Folosește butoanele de mai jos pentru a verifica cereri, programări și statistici.
`.trim()

// ── Formatters ────────────────────────────────────────────────────────────────

function formatLeads(items: any[]) {
  if (!items.length) return '📭 <b>Nicio cerere</b>'
  const lines = items.slice(0, 5).map((r, i) => {
    const msg = r.message || r.description || ''
    return [
      `<b>${i + 1}. ${fmt(r.name)}</b> · ${statusLabel(r.status)}`,
      `📞 ${fmt(r.phone)}${r.location ? ` · 📍 ${esc(r.location)}` : ''}`,
      r.scheduledAt ? `📅 ${esc(r.scheduledAt)}` : '',
      msg ? `<i>${trunc(esc(msg), 120)}</i>` : '',
      `<code>${esc(r.id)}</code> · ${dateShort(r.createdAt)}`,
    ].filter(Boolean).join('\n')
  })
  return `📋 <b>Cereri recente (${items.length} total)</b>\n\n` + lines.join('\n\n')
}

function leadsButtons(items: any[]) {
  const rows = items.slice(0, 5).map((r, i) => [{
    text: `${i + 1}. ${r.name} — schimbă status`,
    callback_data: `lv:${r.id}`,
  }])
  rows.push([{ text: '⬅️ Meniu principal', callback_data: 'menu' }])
  return rows
}

function formatBookings(items: any[]) {
  if (!items.length) return '📭 <b>Nicio programare</b>'
  const lines = items.slice(0, 5).map((r, i) => [
    `<b>${i + 1}. ${fmt(r.name)}</b> · ${statusLabel(r.status)}`,
    `<b>${fmt(r.serviceSlug)}</b> · 📅 ${fmt(r.date)}`,
    `📞 ${fmt(r.phone)}${r.address ? ` · 📍 ${esc(r.address)}` : ''}`,
    `<code>${esc(r.id)}</code> · ${dateShort(r.createdAt)}`,
  ].filter(Boolean).join('\n'))
  return `📅 <b>Programări recente (${items.length} total)</b>\n\n` + lines.join('\n\n')
}

function bookingsButtons(items: any[]) {
  const rows = items.slice(0, 5).map((r, i) => [{
    text: `${i + 1}. ${r.name} — schimbă status`,
    callback_data: `bv:${r.id}`,
  }])
  rows.push([{ text: '⬅️ Meniu principal', callback_data: 'menu' }])
  return rows
}

function formatStats(leads: any[], bookings: any[]) {
  function countBy(arr: any[]) {
    return arr.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  const ls = countBy(leads)
  const bs = countBy(bookings)
  const row = (counts: Record<string, number>) =>
    ALL_STATUSES.map(s => `${statusLabel(s)}: <b>${counts[s] ?? 0}</b>`).join('\n')
  return [
    '📊 <b>Statistici</b>',
    '',
    `📋 <b>Cereri</b> (${leads.length} total)`,
    row(ls),
    '',
    `📅 <b>Programări</b> (${bookings.length} total)`,
    row(bs),
  ].join('\n')
}

function formatLeadDetail(r: any) {
  const msg = r.message || r.description || ''
  return [
    `📋 <b>Cerere: ${fmt(r.name)}</b>`,
    `📞 ${fmt(r.phone)}${r.location ? ` · 📍 ${esc(r.location)}` : ''}`,
    r.scheduledAt ? `📅 Dată dorită: ${esc(r.scheduledAt)}` : '',
    msg ? `💬 ${trunc(esc(msg), 200)}` : '',
    `Status: <b>${statusLabel(r.status)}</b>`,
    `<code>${esc(r.id)}</code>`,
  ].filter(Boolean).join('\n')
}

function formatBookingDetail(r: any) {
  return [
    `📅 <b>Programare: ${fmt(r.name)}</b>`,
    `<b>${fmt(r.serviceSlug)}</b> · 📅 ${fmt(r.date)}`,
    `📞 ${fmt(r.phone)}${r.address ? ` · 📍 ${esc(r.address)}` : ''}`,
    r.notes ? `💬 ${trunc(esc(r.notes), 200)}` : '',
    `Status: <b>${statusLabel(r.status)}</b>`,
    `<code>${esc(r.id)}</code>`,
  ].filter(Boolean).join('\n')
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const settings = await getSettings(event)
  const secret = settings.telegram?.webhookSecret ?? ''
  const incoming = getHeader(event, 'x-telegram-bot-api-secret-token') ?? ''

  if (!secret || !incoming || incoming !== secret) {
    return { ok: true }
  }

  const botToken = settings.telegram?.botToken ?? ''
  const adminChatIds = settings.telegram?.chatIds?.length
    ? settings.telegram.chatIds
    : (settings.telegram?.chatId ? [settings.telegram.chatId] : [])
  const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

  let body: any
  try {
    body = await readBody(event)
  } catch {
    return { ok: true }
  }

  const message = body?.message
  const callbackQuery = body?.callback_query

  const chatId = String(message?.chat?.id ?? callbackQuery?.message?.chat?.id ?? '')
  const callbackId = callbackQuery?.id as string | undefined
  const callbackData = callbackQuery?.data as string | undefined
  const text = (message?.text ?? '') as string
  const messageId = callbackQuery?.message?.message_id as number | undefined

  if (!chatId) return { ok: true }

  if (adminChatIds.length > 0 && !adminChatIds.includes(chatId)) {
    if (callbackId) await answerCallbackQuery(botToken, callbackId)
    return { ok: true }
  }

  async function loadData() {
    const [leads, bookings] = await Promise.all([
      kvList(event, 'lead:'),
      kvList(event, 'booking:'),
    ])
    const sort = (arr: any[]) => arr.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    return { leads: sort(leads), bookings: sort(bookings) }
  }

  const backToLeads = [{ text: '⬅️ Înapoi la cereri', callback_data: 'leads' }]
  const backToBookings = [{ text: '⬅️ Înapoi la programări', callback_data: 'bookings' }]
  const backToMenu = [{ text: '⬅️ Meniu principal', callback_data: 'menu' }]

  if (callbackQuery) {
    if (callbackId) await answerCallbackQuery(botToken, callbackId)

    if (callbackData === 'menu') {
      await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl), messageId)
      return { ok: true }
    }

    if (callbackData === 'leads') {
      const { leads } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatLeads(leads), leadsButtons(leads), messageId)
      return { ok: true }
    }

    if (callbackData === 'bookings') {
      const { bookings } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatBookings(bookings), bookingsButtons(bookings), messageId)
      return { ok: true }
    }

    if (callbackData === 'stats') {
      const { leads, bookings } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatStats(leads, bookings), [backToMenu], messageId)
      return { ok: true }
    }

    // Lead detail: lv:<id>
    if (callbackData?.startsWith('lv:')) {
      const id = callbackData.slice(3)
      const r = await kvGet(event, `lead:${id}`)
      if (!r) { await sendTelegramMessage(botToken, chatId, '❌ Cererea nu a fost găsită.'); return { ok: true } }
      await sendWithKeyboard(botToken, chatId, formatLeadDetail(r), [...statusButtons('ls', id, (r as any).status), backToLeads], messageId)
      return { ok: true }
    }

    // Lead status change: ls:<id>:<status>
    if (callbackData?.startsWith('ls:')) {
      const parts = callbackData.split(':')
      const id = parts[1]
      const newStatus = parts[2]
      if (!id || !ALL_STATUSES.includes(newStatus as Status)) return { ok: true }
      const r = await kvGet(event, `lead:${id}`)
      if (!r) return { ok: true }
      const updated = { ...(r as any), status: newStatus as string }
      await kvPut(event, `lead:${id}`, updated)
      await sendWithKeyboard(
        botToken, chatId,
        formatLeadDetail(updated) + `\n\n✅ Status → <b>${statusLabel(newStatus as string)}</b>`,
        [...statusButtons('ls', id, newStatus as string), backToLeads],
        messageId,
      )
      return { ok: true }
    }

    // Booking detail: bv:<id>
    if (callbackData?.startsWith('bv:')) {
      const id = callbackData.slice(3)
      const r = await kvGet(event, `booking:${id}`)
      if (!r) { await sendTelegramMessage(botToken, chatId, '❌ Programarea nu a fost găsită.'); return { ok: true } }
      await sendWithKeyboard(botToken, chatId, formatBookingDetail(r), [...statusButtons('bs', id, (r as any).status), backToBookings], messageId)
      return { ok: true }
    }

    // Booking status change: bs:<id>:<status>
    if (callbackData?.startsWith('bs:')) {
      const parts = callbackData.split(':')
      const id = parts[1]
      const newStatus = parts[2]
      if (!id || !ALL_STATUSES.includes(newStatus as Status)) return { ok: true }
      const r = await kvGet(event, `booking:${id}`)
      if (!r) return { ok: true }
      const updated = { ...(r as any), status: newStatus as string }
      await kvPut(event, `booking:${id}`, updated)
      await sendWithKeyboard(
        botToken, chatId,
        formatBookingDetail(updated) + `\n\n✅ Status → <b>${statusLabel(newStatus as string)}</b>`,
        [...statusButtons('bs', id, newStatus as string), backToBookings],
        messageId,
      )
      return { ok: true }
    }

    return { ok: true }
  }

  // Text commands
  const cmd = text.split(' ')[0]?.toLowerCase().replace(/^\//, '') ?? ''

  if (cmd === 'start' || cmd === 'meniu' || cmd === 'menu') {
    await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl))
  } else if (cmd === 'cereri' || cmd === 'leads') {
    const { leads } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatLeads(leads), leadsButtons(leads))
  } else if (cmd === 'programari' || cmd === 'bookings') {
    const { bookings } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatBookings(bookings), bookingsButtons(bookings))
  } else if (cmd === 'status' || cmd === 'statistici' || cmd === 'stats') {
    const { leads, bookings } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatStats(leads, bookings), [backToMenu])
  } else if (cmd === 'ajutor' || cmd === 'help') {
    const helpText = [
      '🤖 <b>Comenzi disponibile:</b>',
      '',
      '/start — Meniu principal',
      '/cereri — Cereri recente',
      '/programari — Programări recente',
      '/statistici — Statistici generale',
      '/ajutor — Acest mesaj',
    ].join('\n')
    await sendTelegramMessage(botToken, chatId, helpText)
  } else if (text) {
    await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl))
  }

  return { ok: true }
})
