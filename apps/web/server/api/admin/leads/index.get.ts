import { requireAdmin } from '~~/server/utils/auth'
import { kvList } from '~~/server/utils/storage'

function stripAttachmentData(item: any) {
  if (!item.attachments?.length) return item
  return {
    ...item,
    attachments: item.attachments.map((a: any) => ({
      name: a.name,
      type: a.type,
      size: a.size,
    })),
  }
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const items = await kvList(event, 'lead:')
  return items
    .sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .map(stripAttachmentData)
})
