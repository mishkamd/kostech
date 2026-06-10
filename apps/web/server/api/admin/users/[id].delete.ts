import { requireAdmin, listUsers } from '~~/server/utils/auth'
import { kvDelete } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const me = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!

  if (me.id === id) throw createError({ statusCode: 400, statusMessage: 'Cannot delete yourself' })

  const users = await listUsers(event)
  if (users.length <= 1) throw createError({ statusCode: 400, statusMessage: 'Cannot delete last admin user' })

  await kvDelete(event, `user:${id}`)
  return { ok: true }
})
