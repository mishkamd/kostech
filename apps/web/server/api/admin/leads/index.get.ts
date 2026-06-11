import { requireAdmin } from '~~/server/utils/auth'
import { kvList, kvListCacheGet, kvListCacheSet } from '~~/server/utils/storage'
import { kvCacheGet, kvCacheSet } from '~~/server/utils/kvCache'
import { getD1, d1ListLeads, type LeadRecord } from '~~/server/utils/d1'

function stripAttachmentData(item: LeadRecord) {
  if (!item.attachments?.length) return item
  const { _r2Keys: _k, ...rest } = item
  return rest
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const limit = query._limit ? Number(query._limit) : 0

  // 1. Worker Memory Cache (10s)
  const memKey = 'lead:'
  const fromMem = kvCacheGet(memKey)
  if (fromMem) {
    let items = [...fromMem].sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    if (limit > 0) items = items.slice(0, limit)
    return items.map(i => stripAttachmentData(i as unknown as LeadRecord))
  }

  const db = getD1(event)

  if (db) {
    // 2. KV list cache (60s)
    let list = await kvListCacheGet<LeadRecord>(event, 'lead:__list__')
    if (!list) {
      // 3. D1 — source of truth
      list = await d1ListLeads(db)
      await kvListCacheSet(event, 'lead:__list__', list)
    }
    kvCacheSet(memKey, list)
    let items = [...list]
    if (limit > 0) items = items.slice(0, limit)
    return items.map(stripAttachmentData)
  }

  // Dev fallback: KV individual keys
  const raw = await kvList(event, 'lead:')
  kvCacheSet(memKey, raw)
  let items = [...raw].sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  if (limit > 0) items = items.slice(0, limit)
  return items.map(i => stripAttachmentData(i as unknown as LeadRecord))
})
