export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ lang: string; content: Record<string, unknown> }>(event)
  if (!body?.lang || !['ro', 'ru', 'en'].includes(body.lang)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid locale' })
  }
  if (!body.content || typeof body.content !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid content' })
  }
  await kvPut(event, `content:homepage:${body.lang}`, body.content)
  // Keep layout order consistent across all locales via a shared key
  const layoutOrder = (body.content as Record<string, unknown>).layoutOrder
  if (Array.isArray(layoutOrder)) {
    await kvPut(event, 'content:homepage:layout', { layoutOrder })
  }
  return { ok: true }
})
