import { requireAdmin } from '~~/server/utils/auth'
import { kvList, kvDelete } from '~~/server/utils/storage'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const leads = await kvList(event, 'lead:') as any[]
  await Promise.all(leads.map((l: any) => kvDelete(event, `lead:${l.id}`)))
  kvCacheInvalidate('lead:')
  return { ok: true, deleted: leads.length }
})
