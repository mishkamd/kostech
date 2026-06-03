export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ lang: string; content: Record<string, unknown> }>(event)
  if (!body?.lang || !['ro', 'ru', 'en'].includes(body.lang)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid locale' })
  }
  if (!body.content || typeof body.content !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid content' })
  }
  await kvPut(event, `content:homepage:${body.lang}`, body.content)
  return { ok: true }
})
