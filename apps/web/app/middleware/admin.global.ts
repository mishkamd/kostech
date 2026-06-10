export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return
  if (import.meta.server) {
    const { cookie } = useRequestHeaders(['cookie'])
    if (!cookie?.includes('kostech_admin=')) return navigateTo('/admin/login')
  } else {
    // Client: check readable indicator cookie (httpOnly is invisible to JS)
    if (!document.cookie.includes('kostech_admin_ok=')) return navigateTo('/admin/login')
  }
})
