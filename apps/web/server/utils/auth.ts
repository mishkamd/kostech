import type { H3Event } from 'h3'

export function requireAdmin(event: H3Event) {
  const cookie = getCookie(event, 'kostech_admin')
  const expected = process.env.NUXT_ADMIN_TOKEN || 'dev-admin-token'
  if (!cookie || cookie !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
