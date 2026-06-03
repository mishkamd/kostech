export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string }>(event)
  const expected = process.env.NUXT_ADMIN_TOKEN || 'dev-admin-token'
  if (!body?.token || body.token !== expected) {
    throw createError({ statusCode: 401, statusMessage: 'Token invalid' })
  }
  const isProd = process.env.NODE_ENV === 'production'
  // httpOnly session cookie (can't be read by JS — used server-side)
  setCookie(event, 'kostech_admin', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  // Readable indicator cookie for client-side middleware guard
  setCookie(event, 'kostech_admin_ok', '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return { ok: true }
})
