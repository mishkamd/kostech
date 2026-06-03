export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const locales = ['ro', 'ru', 'en']
  const results: Record<string, unknown> = {}
  for (const locale of locales) {
    const override = await kvGet(event, `content:homepage:${locale}`)
    results[locale] = mergeContent(
      getDefaultContent(locale),
      override as Parameters<typeof mergeContent>[1],
    )
  }
  return results
})
