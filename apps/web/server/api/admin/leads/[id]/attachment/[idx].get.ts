import { requireAdmin } from '~~/server/utils/auth'
import { kvGet } from '~~/server/utils/storage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const idx = parseInt(getRouterParam(event, 'idx') ?? '', 10)

  if (!id || isNaN(idx) || idx < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri invalizi' })
  }

  const record = await kvGet(event, `lead:${id}`)
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Lead negăsit' })
  }

  const attachments = (record as any).attachments as Array<{ name: string; type: string; data: string }> | undefined
  if (!attachments || idx >= attachments.length) {
    throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })
  }

  const file = attachments[idx]
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })
  }

  const buf = Buffer.from(file.data, 'base64')

  setResponseHeader(event, 'Content-Type', file.type)
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
  setResponseHeader(event, 'Content-Length', buf.length)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=0')
  return buf
})
