import { z } from 'zod'
import type { H3Event } from 'h3'
import { kvGet, kvPut } from './storage'

/**
 * Schema for admin settings persisted under the single KV key `settings:admin`.
 * - telegram.botToken is WRITE-ONLY: GET never returns the plaintext token, it
 *   returns either `null` (not set) or a redacted `'****<last4>'` marker.
 * - PUT accepts a new token OR the explicit `null` to clear it OR the redacted
 *   marker `'****'` to leave it unchanged.
 * - `notifications` toggles per event type. `lastReadAt` is the timestamp used
 *   to compute the unread count shown in the admin bell.
 */
export const TelegramConfigSchema = z.object({
  botToken: z.string().min(1).max(200).optional().default(''),
  chatId: z.string().min(1).max(64).optional().default(''),
  enabled: z.boolean().optional().default(false),
})

export const NotificationTogglesSchema = z.object({
  leadCreated: z.boolean().optional().default(true),
  bookingCreated: z.boolean().optional().default(true),
  leadStatusChanged: z.boolean().optional().default(true),
  bookingStatusChanged: z.boolean().optional().default(true),
})

export const SettingsSchema = z.object({
  telegram: TelegramConfigSchema.optional().default({}),
  notifications: NotificationTogglesSchema.optional().default({}),
  lastReadAt: z.number().int().nonnegative().optional().default(0),
  updatedAt: z.number().int().nonnegative().optional().default(0),
})

export type Settings = z.infer<typeof SettingsSchema>
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>

const SETTINGS_KEY = 'settings:admin'

export const DEFAULT_SETTINGS: Settings = {
  telegram: { botToken: '', chatId: '', enabled: false },
  notifications: {
    leadCreated: true,
    bookingCreated: true,
    leadStatusChanged: true,
    bookingStatusChanged: true,
  },
  lastReadAt: 0,
  updatedAt: 0,
}

/**
 * Read settings from KV. Falls back to defaults when missing or malformed.
 * The returned object keeps the plaintext botToken — callers that expose it
 * over HTTP MUST run it through {@link sanitizeSettings} first.
 */
export async function getSettings(event: H3Event): Promise<Settings> {
  const raw = await kvGet(event, SETTINGS_KEY)
  if (!raw) return { ...DEFAULT_SETTINGS }
  const merged: Settings = {
    telegram: { ...DEFAULT_SETTINGS.telegram, ...(raw.telegram as object ?? {}) } as Settings['telegram'],
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(raw.notifications as object ?? {}) } as Settings['notifications'],
    lastReadAt: Number(raw.lastReadAt ?? 0),
    updatedAt: Number(raw.updatedAt ?? 0),
  }
  return merged
}

/**
 * Persist settings under the single `settings:admin` KV key. Caller is
 * responsible for merging any partial input. Always stamps `updatedAt`.
 */
export async function saveSettings(event: H3Event, next: Settings): Promise<Settings> {
  const merged: Settings = {
    telegram: { ...DEFAULT_SETTINGS.telegram, ...(next.telegram ?? {}) } as Settings['telegram'],
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(next.notifications ?? {}) } as Settings['notifications'],
    lastReadAt: Number(next.lastReadAt ?? 0),
    updatedAt: Date.now(),
  }
  await kvPut(event, SETTINGS_KEY, merged as unknown as Record<string, unknown>)
  return merged
}

/**
 * Return a safe-to-send JSON copy of the settings with the bot token redacted.
 * GET handlers MUST use this before returning data to the browser.
 */
export function sanitizeSettings(settings: Settings) {
  const token = settings.telegram?.botToken ?? ''
  const tail = token.length > 4 ? token.slice(-4) : ''
  return {
    telegram: {
      botToken: token ? `****${tail}` : '',
      chatId: settings.telegram?.chatId ?? '',
      enabled: Boolean(settings.telegram?.enabled),
      configured: Boolean(token && settings.telegram?.chatId),
    },
    notifications: {
      leadCreated: Boolean(settings.notifications?.leadCreated ?? true),
      bookingCreated: Boolean(settings.notifications?.bookingCreated ?? true),
      leadStatusChanged: Boolean(settings.notifications?.leadStatusChanged ?? true),
      bookingStatusChanged: Boolean(settings.notifications?.bookingStatusChanged ?? true),
    },
    lastReadAt: Number(settings.lastReadAt ?? 0),
    updatedAt: Number(settings.updatedAt ?? 0),
  }
}
