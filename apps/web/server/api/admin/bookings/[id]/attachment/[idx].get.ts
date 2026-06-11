import { requireAdmin } from '~~/server/utils/auth'
import { kvGet } from '~~/server/utils/storage'
import { getD1, d1GetBooking } from '~~/server/utils/d1'
import { r2GetAttachment } from '~~/server/utils/r2'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const idx = parseInt(getRouterParam(event, 'idx') ?? '', 10)

  if (!id || isNaN(idx) || idx < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Parametri invalizi' })
  }

  const db = getD1(event)

  if (db) {
    const record = await d1GetBooking(db, id)
    if (!record) throw createError({ statusCode: 404, statusMessage: 'Programare negăsită' })

    const meta = record.attachments?.[idx]
    const r2Key = record._r2Keys?.[idx]
    if (!meta || !r2Key) throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })

    const file = await r2GetAttachment(event, r2Key)
    if (!file) throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })

    setResponseHeader(event, 'Content-Type', meta.type)
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(meta.name)}"`)
    setResponseHeader(event, 'Content-Length', file.data.byteLength)
    setResponseHeader(event, 'Cache-Control', 'private, max-age=300')
    return Buffer.from(file.data)
  }

  // Dev fallback: base64 stored in KV
  const record = await kvGet(event, `booking:${id}`)
  if (!record) throw createError({ statusCode: 404, statusMessage: 'Programare negăsită' })

  const attachments = (record as any).attachments as Array<{ name: string; type: string; data: string }> | undefined
  if (!attachments || idx >= attachments.length) throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })

  const file = attachments[idx]
  if (!file) throw createError({ statusCode: 404, statusMessage: 'Fișier negăsit' })

  const buf = Buffer.from(file.data, 'base64')
  setResponseHeader(event, 'Content-Type', file.type)
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`)
  setResponseHeader(event, 'Content-Length', buf.length)
  setResponseHeader(event, 'Cache-Control', 'private, max-age=0')
  return buf
})
