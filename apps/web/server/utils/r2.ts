import type { H3Event } from 'h3'

// --- minimal R2 type stubs ---
interface R2ObjectBody {
  arrayBuffer(): Promise<ArrayBuffer>
  httpMetadata?: { contentType?: string }
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | string | ReadableStream, options?: object): Promise<unknown>
  get(key: string): Promise<R2ObjectBody | null>
  delete(keys: string | string[]): Promise<void>
}

export function getR2(event: H3Event): R2Bucket | null {
  const env = (event.context as { cloudflare?: { env?: { MEDIA?: R2Bucket } } })?.cloudflare?.env
  return env?.MEDIA ?? null
}

export async function r2PutAttachment(
  event: H3Event,
  key: string,
  data: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const r2 = getR2(event)
  if (r2) {
    await r2.put(key, data, { httpMetadata: { contentType } })
    return
  }
  // Dev fallback: base64 in Nitro filesystem storage
  await useStorage('cache').setItem(`r2:${key}`, {
    data: Buffer.from(data).toString('base64'),
    contentType,
  })
}

export async function r2GetAttachment(
  event: H3Event,
  key: string,
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const r2 = getR2(event)
  if (r2) {
    const obj = await r2.get(key)
    if (!obj) return null
    return {
      data: await obj.arrayBuffer(),
      contentType: obj.httpMetadata?.contentType ?? 'application/octet-stream',
    }
  }
  // Dev fallback
  const entry = await useStorage('cache').getItem<{ data: string; contentType: string }>(`r2:${key}`)
  if (!entry) return null
  const buf = Buffer.from(entry.data, 'base64')
  return { data: buf.buffer as ArrayBuffer, contentType: entry.contentType }
}

export async function r2DeleteAttachments(event: H3Event, keys: string[]): Promise<void> {
  if (!keys.length) return
  const r2 = getR2(event)
  if (r2) {
    await r2.delete(keys)
    return
  }
  await Promise.all(keys.map(k => useStorage('cache').removeItem(`r2:${k}`)))
}
