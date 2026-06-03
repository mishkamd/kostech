import { defineEventHandler, getQuery } from 'h3'
import { kvGet } from '~~/server/utils/storage'
import { defaultServicesForLang, mergeServices } from '~~/server/utils/services-defaults'
import type { Service } from '~~/app/content/services'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const langParam = (q.lang as string) || 'ro'
  const locale = (langParam === 'ru' || langParam === 'en') ? langParam : 'ro'

  const override = await kvGet(event, `content:services:${locale}`) as Service[] | null
  return mergeServices(defaultServicesForLang(locale), override)
})
