export default defineEventHandler(async (event) => {
  const lang = (getQuery(event).lang as string) || 'ro'
  const locale = ['ro', 'ru', 'en'].includes(lang) ? lang : 'ro'
  const override = await kvGet(event, `content:homepage:${locale}`)
  return mergeContent(getDefaultContent(locale), override as Parameters<typeof mergeContent>[1])
})
