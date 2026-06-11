import { requireAdmin } from '~~/server/utils/auth'
import { kvList } from '~~/server/utils/storage'
import { kvCacheGet, kvCacheSet } from '~~/server/utils/kvCache'

function stripAttachmentData(item: any) {
  if (!item.attachments?.length) return item
  return {
    ...item,
    attachments: item.attachments.map((a: any) => ({
      name: a.name,
      type: a.type,
      size: a.size,
    })),
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const limit = query._limit ? Number(query._limit) : 0
  const raw: unknown[] = kvCacheGet('lead:') ?? await kvList(event, 'lead:').then(r => { kvCacheSet('lead:', r); return r })
  let items = [...raw].sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  if (limit > 0) items = items.slice(0, limit)
  return items.map(stripAttachmentData)
})
