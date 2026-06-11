import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvDelete, kvListCacheDelete } from '~~/server/utils/storage'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'
import { getD1, d1GetLead, d1DeleteLead } from '~~/server/utils/d1'
import { r2DeleteAttachments } from '~~/server/utils/r2'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })

  const db = getD1(event)

  if (db) {
    const current = await d1GetLead(db, id)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    const r2Keys = await d1DeleteLead(db, id)
    await r2DeleteAttachments(event, r2Keys)
    await kvListCacheDelete(event, 'lead:__list__')
  }
  else {
    const current = await kvGet(event, `lead:${id}`)
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
    await kvDelete(event, `lead:${id}`)
  }

  kvCacheInvalidate('lead:')
  return { ok: true }
})
