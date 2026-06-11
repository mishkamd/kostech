import type { H3Event } from 'h3'

type Json = Record<string, unknown>

// Cache hierarchy:
//   Request → Edge Cache (Cache-Control headers)
//          → Worker Memory (kvCache.ts, 10s TTL Map)
//          → KV (CACHE binding, 60s TTL for list snapshots)
//          → D1 (DB binding, source of truth for bookings/leads)
// Attachments bypass KV/D1 and go directly to R2 (MEDIA binding).

function getKV(event: H3Event): KVNamespace | null {
  const env = (event.context as { cloudflare?: { env?: { CACHE?: KVNamespace } } })?.cloudflare?.env
  if (env?.CACHE) return env.CACHE
  return null
}

// Dev fallback: Nitro filesystem-backed storage (configured via nitro.devStorage)
const store = () => useStorage('cache')

// KV list-cache helpers — used as the KV layer in front of D1 for booking/lead lists.
// Key convention: "booking:__list__" / "lead:__list__"
// TTL 60s on Cloudflare KV; dev fallback has no TTL (invalidated explicitly).
const KV_LIST_TTL = 60 // seconds

export async function kvListCacheGet<T>(event: H3Event, key: string): Promise<T[] | null> {
  const kv = getKV(event)
  if (kv) return ((await kv.get(key, 'json')) as T[] | null) ?? null
  return await store().getItem<T[]>(key)
}

export async function kvListCacheSet<T>(event: H3Event, key: string, data: T[]): Promise<void> {
  const kv = getKV(event)
  if (kv) {
    await kv.put(key, JSON.stringify(data), { expirationTtl: KV_LIST_TTL })
    return
  }
  await store().setItem(key, data)
}

export async function kvListCacheDelete(event: H3Event, key: string): Promise<void> {
  const kv = getKV(event)
  if (kv) { await kv.delete(key); return }
  await store().removeItem(key)
}

export async function kvList(event: H3Event, prefix: string): Promise<Json[]> {
  const kv = getKV(event)
  if (kv) {
    const list = await kv.list({ prefix })
    const items = await Promise.all(
      list.keys.map(async (k) => {
        const v = await kv.get(k.name, 'json')
        return v as Json
      }),
    )
    return items.filter(Boolean) as Json[]
  }
  const keys = await store().getKeys(prefix)
  const items = await Promise.all(keys.map(k => store().getItem<Json>(k)))
  return items.filter(Boolean) as Json[]
}

export async function kvPut(event: H3Event, key: string, value: Json): Promise<void> {
  const kv = getKV(event)
  if (kv) {
    await kv.put(key, JSON.stringify(value))
    return
  }
  await store().setItem(key, value)
}

export async function kvGet(event: H3Event, key: string): Promise<Json | null> {
  const kv = getKV(event)
  if (kv) return ((await kv.get(key, 'json')) as Json) ?? null
  return await store().getItem<Json>(key)
}

export async function kvDelete(event: H3Event, key: string): Promise<void> {
  const kv = getKV(event)
  if (kv) {
    await kv.delete(key)
    return
  }
  await store().removeItem(key)
}

export function newId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${ts}${rnd}`
}

// Minimal KVNamespace shape from Cloudflare Workers types (avoids importing the full package on server stub)
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<unknown>
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(opts?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: unknown }[]
    list_complete: boolean
    cursor?: string
  }>
}
