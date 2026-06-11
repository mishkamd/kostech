const TTL_MS = 10_000

interface CacheEntry { data: unknown[]; ts: number }
const store = new Map<string, CacheEntry>()

export function kvCacheGet(prefix: string): unknown[] | null {
  const entry = store.get(prefix)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL_MS) { store.delete(prefix); return null }
  return entry.data
}

export function kvCacheSet(prefix: string, data: unknown[]): void {
  store.set(prefix, { data, ts: Date.now() })
}

export function kvCacheInvalidate(...prefixes: string[]): void {
  for (const p of prefixes) store.delete(p)
}
