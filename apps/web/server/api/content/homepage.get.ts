export default defineCachedEventHandler(async (event) => {
  const lang = (getQuery(event).lang as string) || 'ro'
  const locale = ['ro', 'ru', 'en'].includes(lang) ? lang : 'ro'
  const [override, layoutKv] = await Promise.all([
    kvGet(event, `content:homepage:${locale}`),
    kvGet(event, 'content:homepage:layout'),
  ])
  const content = mergeContent(getDefaultContent(locale), override as Parameters<typeof mergeContent>[1])
  const sharedOrder = (layoutKv as Record<string, unknown> | null)?.layoutOrder
  if (Array.isArray(sharedOrder)) content.layoutOrder = sharedOrder as string[]
  return content
}, {
  maxAge: 60, // 1 min cache, KV reads are expensive
  swr: true,  // stale-while-revalidate — instant response while refreshing
})
