import { requireAdmin } from '~~/server/utils/auth'
import { kvGet, kvDelete } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID lipsă' })
  const current = await kvGet(event, `lead:${id}`)
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Inexistent' })
  await kvDelete(event, `lead:${id}`)
  return { ok: true }
})
