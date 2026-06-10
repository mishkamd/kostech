import { defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '~~/server/utils/auth'
import { kvPut } from '~~/server/utils/storage'
import type { Service } from '~~/app/content/services'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ lang: string; services: Service[] }>(event)

  if (!body.lang || !Array.isArray(body.services)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  const lang = body.lang as 'ro' | 'ru' | 'en'
  await kvPut(event, `content:services:${lang}`, body.services as unknown as Record<string, unknown>)

  return { ok: true }
})