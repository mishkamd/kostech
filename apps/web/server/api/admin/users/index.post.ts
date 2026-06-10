import { requireAdmin, getUserByUsername, createUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ username?: string; password?: string }>(event)
  if (!body?.username?.trim() || !body?.password)
    throw createError({ statusCode: 400, statusMessage: 'Username and password required' })

  const username = body.username.trim().toLowerCase()
  const existing = await getUserByUsername(event, username)
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Username already taken' })

  return createUser(event, username, body.password)
})
