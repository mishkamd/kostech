import { requireAdmin, getUser, getUserByUsername, hashPassword } from '~~/server/utils/auth'
import { kvPut } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const me = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const user = await getUser(event, id)
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  const body = await readBody<{ username?: string; password?: string }>(event)
  const updated = { ...user }

  if (body?.username) {
    const newUsername = body.username.trim().toLowerCase()
    if (newUsername !== user.username) {
      const conflict = await getUserByUsername(event, newUsername)
      if (conflict) throw createError({ statusCode: 409, statusMessage: 'Username already taken' })
      updated.username = newUsername
    }
  }

  if (body?.password) {
    const { hash, salt } = await hashPassword(body.password)
    updated.passwordHash = hash
    updated.salt = salt
  }

  await kvPut(event, `user:${id}`, updated as unknown as Record<string, unknown>)
  const { passwordHash: _h, salt: _s, ...safe } = updated
  return safe
})
