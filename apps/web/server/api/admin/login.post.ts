import { ensureBootstrapUser, getUserByUsername, verifyPassword, createSession } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string }>(event)
  if (!body?.username || !body?.password)
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })

  await ensureBootstrapUser(event)

  const user = await getUserByUsername(event, body.username.trim().toLowerCase())
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  const valid = await verifyPassword(body.password, user.passwordHash, user.salt)
  if (!valid) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })

  await createSession(event, user.id)
  return { ok: true }
})
