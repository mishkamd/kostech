import type { H3Event } from 'h3'
import { kvGet, kvPut, kvList, kvDelete, newId } from './storage'

// ── Crypto helpers ────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return bytes
}

// ── Password hashing (PBKDF2 via Web Crypto) ──────────────────────────────────

export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: derived } = await hashPassword(password, salt)
  return derived === hash
}

// ── User types ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  salt: string
  createdAt: string
}

export type SafeUser = Omit<AdminUser, 'passwordHash' | 'salt'>

// ── User CRUD ─────────────────────────────────────────────────────────────────

export async function getUser(event: H3Event, id: string): Promise<AdminUser | null> {
  return (await kvGet(event, `user:${id}`)) as AdminUser | null
}

export async function getUserByUsername(event: H3Event, username: string): Promise<AdminUser | null> {
  const users = (await kvList(event, 'user:')) as unknown as AdminUser[]
  return users.find(u => u.username === username) ?? null
}

export async function listUsers(event: H3Event): Promise<SafeUser[]> {
  const users = (await kvList(event, 'user:')) as unknown as AdminUser[]
  return users.map(({ passwordHash: _h, salt: _s, ...u }) => u)
}

export async function createUser(event: H3Event, username: string, password: string): Promise<SafeUser> {
  const { hash, salt } = await hashPassword(password)
  const user: AdminUser = {
    id: newId('user'),
    username,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  }
  await kvPut(event, `user:${user.id}`, user as unknown as Record<string, unknown>)
  const { passwordHash: _h, salt: _s, ...safe } = user
  return safe
}

// Bootstrap: create default admin from env vars if no users exist yet
export async function ensureBootstrapUser(event: H3Event): Promise<void> {
  const existing = await kvList(event, 'user:')
  if (existing.length > 0) return
  const username = process.env.NUXT_ADMIN_USERNAME || 'admin'
  const password = process.env.NUXT_ADMIN_TOKEN || 'dev-admin-token'
  await createUser(event, username, password)
}

// ── Session management ────────────────────────────────────────────────────────

const SESSION_COOKIE = 'kostech_admin'
const SESSION_TTL = 60 * 60 * 24 * 7 // 7 days

export async function createSession(event: H3Event, userId: string): Promise<void> {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString()
  await kvPut(event, `session:${token}`, { token, userId, expiresAt })
  const isProd = process.env.NODE_ENV === 'production'
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: isProd, path: '/', maxAge: SESSION_TTL,
  })
  setCookie(event, 'kostech_admin_ok', '1', {
    httpOnly: false, sameSite: 'lax', secure: isProd, path: '/', maxAge: SESSION_TTL,
  })
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  if (token) await kvDelete(event, `session:${token}`)
  deleteCookie(event, SESSION_COOKIE)
  deleteCookie(event, 'kostech_admin_ok')
}

export async function requireAdmin(event: H3Event): Promise<AdminUser> {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const session = (await kvGet(event, `session:${token}`)) as { userId: string; expiresAt: string } | null
  if (!session) throw createError({ statusCode: 401, statusMessage: 'Session expired' })

  if (new Date(session.expiresAt) < new Date()) {
    await kvDelete(event, `session:${token}`)
    throw createError({ statusCode: 401, statusMessage: 'Session expired' })
  }

  const user = await getUser(event, session.userId)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'User not found' })
  return user
}
