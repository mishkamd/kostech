import type { H3Event } from 'h3'

type Json = Record<string, unknown>

function getKV(event: H3Event): KVNamespace | null {
  const env = (event.context as { cloudflare?: { env?: { CACHE?: KVNamespace } } })?.cloudflare?.env
  if (env?.CACHE) return env.CACHE
  return null
}

// Dev fallback: Nitro filesystem-backed storage (configured via nitro.devStorage)
const store = () => useStorage('cache')

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
  put(key: string, value: string | ArrayBuffer | ReadableStream): Promise<void>
  delete(key: string): Promise<void>
  list(opts?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: unknown }[]
    list_complete: boolean
    cursor?: string
  }>
}
