import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { kvGet } from '~~/server/utils/storage'
import { defaultServicesForLang, mergeServices } from '~~/server/utils/services-defaults'
import type { Service } from '~~/app/content/services'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const locales = ['ro', 'ru', 'en'] as const
  const result: Record<'ro' | 'ru' | 'en', Service[]> = { ro: [], ru: [], en: [] }

  for (const lang of locales) {
    const stored = await kvGet(event, `content:services:${lang}`) as Service[] | null
    result[lang] = mergeServices(defaultServicesForLang(lang), stored)
  }

  return result
})