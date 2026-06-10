import { requireAdmin, listUsers } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return listUsers(event)
})
