export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const locales = ['ro', 'ru', 'en']
  const [layoutKv, ...overrides] = await Promise.all([
    kvGet(event, 'content:homepage:layout'),
    ...locales.map(locale => kvGet(event, `content:homepage:${locale}`)),
  ])
  const sharedOrder = (layoutKv as Record<string, unknown> | null)?.layoutOrder
  const results: Record<string, unknown> = {}
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i]!
    const content = mergeContent(
      getDefaultContent(locale),
      overrides[i] as Parameters<typeof mergeContent>[1],
    )
    if (Array.isArray(sharedOrder)) content.layoutOrder = sharedOrder as string[]
    results[locale] = content
  }
  return results
})
