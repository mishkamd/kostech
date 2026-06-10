import { getSettings } from '~~/server/utils/settings'
import { sendTelegramMessage, sendWithKeyboard, answerCallbackQuery } from '~~/server/utils/telegram'
import { kvList } from '~~/server/utils/storage'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s
}

function dateShort(v: unknown) {
  if (!v) return '—'
  const d = new Date(Number(v) || String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
    const service = r.serviceSlug ? `<b>${esc(r.serviceSlug)}</b> · ` : ''
    return [
      `<b>${i + 1}. ${fmt(r.name)}</b>`,
      `${service}📞 ${fmt(r.phone)} · ${statusLabel(r.status)}`,
      r.message ? `<i>${trunc(esc(r.message), 120)}</i>` : '',
      `<code>${esc(r.id)}</code> · ${dateShort(r.createdAt)}`,
    ].filter(Boolean).join('\n')
  })
  return `📋 <b>Cereri recente (${items.length} total)</b>\n\n` + lines.join('\n\n')
}

function formatBookings(items: any[]) {
  if (!items.length) return '📭 <b>Nicio programare</b>'
  const lines = items.slice(0, 5).map((r, i) => [
    `<b>${i + 1}. ${fmt(r.name)}</b>`,
    `<b>${fmt(r.serviceSlug)}</b> · 📅 ${fmt(r.date)} · ${statusLabel(r.status)}`,
    `📞 ${fmt(r.phone)}${r.address ? ` · 📍 ${esc(r.address)}` : ''}`,
    `<code>${esc(r.id)}</code> · ${dateShort(r.createdAt)}`,
  ].filter(Boolean).join('\n'))
  return `📅 <b>Programări recente (${items.length} total)</b>\n\n` + lines.join('\n\n')
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
    ['new', 'in_progress', 'done', 'canceled']
      .map(s => `${statusLabel(s)}: <b>${counts[s] ?? 0}</b>`)
      .join('\n')

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

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // Verify secret token header
  const settings = await getSettings(event)
  const secret = settings.telegram?.webhookSecret ?? ''
  const incoming = getHeader(event, 'x-telegram-bot-api-secret-token') ?? ''

  if (!secret || !incoming || incoming !== secret) {
    // Return 200 to prevent Telegram from retrying, but do nothing
    return { ok: true }
  }

  const botToken = settings.telegram?.botToken ?? ''
  const adminChatId = settings.telegram?.chatId ?? ''
  const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')

  let body: any
  try {
    body = await readBody(event)
  } catch {
    return { ok: true }
  }

  const message = body?.message
  const callbackQuery = body?.callback_query

  // Determine chat ID and action
  const chatId = String(message?.chat?.id ?? callbackQuery?.message?.chat?.id ?? '')
  const callbackId = callbackQuery?.id as string | undefined
  const callbackData = callbackQuery?.data as string | undefined
  const text = (message?.text ?? '') as string
  const messageId = callbackQuery?.message?.message_id as number | undefined

  if (!chatId) return { ok: true }

  // Only respond to the configured admin chat
  if (adminChatId && chatId !== adminChatId) {
    if (callbackId) await answerCallbackQuery(botToken, callbackId)
    return { ok: true }
  }

  // Load data for commands that need it
  async function loadData() {
    const [leads, bookings] = await Promise.all([
      kvList(event, 'lead:'),
      kvList(event, 'booking:'),
    ])
    const sort = (arr: any[]) => arr.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    return { leads: sort(leads), bookings: sort(bookings) }
  }

  const backBtn = [{ text: '⬅️ Meniu principal', callback_data: 'menu' }]

  // Handle callback queries (button presses)
  if (callbackQuery) {
    if (callbackId) await answerCallbackQuery(botToken, callbackId)

    if (callbackData === 'menu') {
      await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl), messageId)
    } else if (callbackData === 'leads') {
      const { leads } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatLeads(leads), [backBtn], messageId)
    } else if (callbackData === 'bookings') {
      const { bookings } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatBookings(bookings), [backBtn], messageId)
    } else if (callbackData === 'stats') {
      const { leads, bookings } = await loadData()
      await sendWithKeyboard(botToken, chatId, formatStats(leads, bookings), [backBtn], messageId)
    }

    return { ok: true }
  }

  // Handle text commands
  const cmd = text.split(' ')[0]?.toLowerCase().replace(/^\//, '') ?? ''

  if (cmd === 'start' || cmd === 'meniu' || cmd === 'menu') {
    await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl))
  } else if (cmd === 'cereri' || cmd === 'leads') {
    const { leads } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatLeads(leads), [backBtn])
  } else if (cmd === 'programari' || cmd === 'bookings') {
    const { bookings } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatBookings(bookings), [backBtn])
  } else if (cmd === 'status' || cmd === 'statistici' || cmd === 'stats') {
    const { leads, bookings } = await loadData()
    await sendWithKeyboard(botToken, chatId, formatStats(leads, bookings), [backBtn])
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
    // Unknown message → show menu
    await sendWithKeyboard(botToken, chatId, WELCOME_TEXT, mainMenuButtons(siteUrl))
  }

  return { ok: true }
})
