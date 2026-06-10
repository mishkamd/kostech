import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/i18n',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    '@vueuse/nuxt',
  ],

  i18n: {
    locales: [
      { code: 'ro', language: 'ro-MD', name: 'Română' },
      { code: 'ru', language: 'ru-RU', name: 'Русский' },
      { code: 'en', language: 'en-US', name: 'English' },
    ],
    defaultLocale: 'ro',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'kostech-locale',
      redirectOn: 'root',
    },
  },

  colorMode: {
    classSuffix: '',
    storageKey: 'kostech-theme',
    preference: 'system',
    fallback: 'light',
  },

  css: ['~/assets/css/tailwind.css'],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  site: {
    url: 'https://kostech.md',
    name: 'Kostech',
    description: 'Servicii IT, mentenanță PC și laptop, administrare servere și rețele în Chișinău, Moldova.',
    defaultLocale: 'ro',
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    autoLastmod: true,
  },

  robots: {
    disallow: ['/admin'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ro' },
      viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          crossorigin: '',
          href: '/fonts/inter-variable-latin.woff2',
        },
        // Preconnect to Unsplash CDN for hero image — eliminates DNS + TCP + TLS from LCP critical path
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
      ],
      meta: [
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#F8F9FA' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#13111C' },
      ],
      script: [
        {
          // No-flash theme: read stored or system preference and set .dark before paint.
          innerHTML: `try{var t=localStorage.getItem('kostech-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`,
          tagPosition: 'head',
          type: 'text/javascript',
        },
      ],
    },
  },

  runtimeConfig: {
    turnstileSecretKey: '',
    public: {
      siteUrl: 'https://kostech.md',
      turnstileSiteKey: '',
    },
  },

  icon: {
    // clientBundle with scan: true auto-tree-shakes — only icons actually used in templates
    // are sent to the client. Drastically smaller than serverBundle which ships all collections.
    clientBundle: { scan: true, sizeLimitKb: 256 },
  },

  image: {
    format: ['avif', 'webp'],
  },

  nitro: {
    preset: 'cloudflare_pages',
    devStorage: {
      cache: { driver: 'fs', base: './.data/kv' },
    },
    prerender: {
      routes: [
        '/', '/servicii', '/booking',
        '/ru', '/ru/servicii', '/ru/booking',
        '/en', '/en/servicii', '/en/booking',
        // Service detail pages — 6 services × 3 locales
        '/servicii/mentenanta-pc', '/servicii/administrare-servere',
        '/servicii/proiectare-retele', '/servicii/securitate-it',
        '/servicii/recuperare-date', '/servicii/consultanta-it',
        '/ru/servicii/mentenanta-pc', '/ru/servicii/administrare-servere',
        '/ru/servicii/proiectare-retele', '/ru/servicii/securitate-it',
        '/ru/servicii/recuperare-date', '/ru/servicii/consultanta-it',
        '/en/servicii/mentenanta-pc', '/en/servicii/administrare-servere',
        '/en/servicii/proiectare-retele', '/en/servicii/securitate-it',
        '/en/servicii/recuperare-date', '/en/servicii/consultanta-it',
      ],
      crawlLinks: true,
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
