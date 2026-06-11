export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // Allow Telegram Mini App WebView to embed /admin — skip X-Frame-Options there
  if (!path.startsWith('/admin')) {
    setHeader(event, 'X-Frame-Options', 'SAMEORIGIN')
  }
})
