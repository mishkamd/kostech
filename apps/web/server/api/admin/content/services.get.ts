import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { kvGet } from '~~/server/utils/storage'
import type { Service } from '~/content/services'
import { services as defaultServices } from '~/content/services'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const locales = ['ro', 'ru', 'en'] as const
  const result: Record<string, Service[]> = {}

  for (const lang of locales) {
    const stored = await kvGet(event, `content:services:${lang}`) as Service[] | null
    result[lang] = stored ?? defaultServices
  }

  return result
})