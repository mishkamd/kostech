export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/login') return
  if (import.meta.server) {
    // Server: check httpOnly session cookie
    const cookie = useCookie('kostech_admin')
    if (!cookie.value) return navigateTo('/admin/login')
  } else {
    // Client: check readable indicator cookie (httpOnly is invisible to JS)
    if (!document.cookie.includes('kostech_admin_ok=')) return navigateTo('/admin/login')
  }
})
