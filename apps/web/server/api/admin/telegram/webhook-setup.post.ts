import { requireAdmin } from '~~/server/utils/auth'
import { getSettings, saveSettings } from '~~/server/utils/settings'
import { setupWebhook, deleteWebhook, getWebhookInfo } from '~~/server/utils/telegram'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ action: 'setup' | 'delete' | 'info' }>(event)
  const settings = await getSettings(event)
  const botToken = settings.telegram?.botToken ?? ''

  if (!botToken) {
    throw createError({ statusCode: 400, statusMessage: 'Bot token nu este configurat' })
  }

  if (body?.action === 'info') {
    const info = await getWebhookInfo(botToken)
    return { ok: info.ok, info: info.ok ? info.result : null, webhookActive: Boolean(settings.telegram?.webhookSecret) }
  }

  if (body?.action === 'delete') {
    const result = await deleteWebhook(botToken)
    if (!result.ok) {
      throw createError({ statusCode: 502, statusMessage: (result as any).description ?? 'Eroare Telegram' })
    }
    await saveSettings(event, {
      ...settings,
      telegram: { ...settings.telegram, webhookSecret: '' },
    })
    return { ok: true, action: 'deleted' }
  }

  if (body?.action && body.action !== 'setup') {
    throw createError({ statusCode: 400, statusMessage: `Acțiune necunoscută: ${body.action}` })
  }

  // action === 'setup'
  const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  if (!siteUrl) {
    throw createError({ statusCode: 400, statusMessage: 'NUXT_PUBLIC_SITE_URL nu este setat' })
  }

  // Reuse existing secret or generate new one
  const existingSecret = settings.telegram?.webhookSecret ?? ''
  const secret = existingSecret || Array.from(
    crypto.getRandomValues(new Uint8Array(32)),
    b => b.toString(16).padStart(2, '0'),
  ).join('')

  const webhookUrl = `${siteUrl}/api/telegram/webhook`
  const result = await setupWebhook(botToken, webhookUrl, secret)

  if (!result.ok) {
    throw createError({ statusCode: 502, statusMessage: (result as any).description ?? 'Eroare Telegram la setarea webhook-ului' })
  }

  await saveSettings(event, {
    ...settings,
    telegram: { ...settings.telegram, webhookSecret: secret },
  })

  return { ok: true, webhookUrl, action: 'setup' }
})
