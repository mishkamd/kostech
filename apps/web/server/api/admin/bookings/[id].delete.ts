import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvDelete } from '~~/server/utils/storage'
import { kvCacheInvalidate } from '~~/server/utils/kvCache'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const current = await kvGet(event, `booking:${id}`)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
  await kvDelete(event, `booking:${id}`)
  kvCacheInvalidate('booking:')
  return { ok: true }
})
