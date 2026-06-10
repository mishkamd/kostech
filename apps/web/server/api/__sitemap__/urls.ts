import { services } from '~~/app/content/services'

export default defineSitemapEventHandler(() => {
  return [
    { loc: '/', priority: 1.0 as const, changefreq: 'weekly' as const },
    { loc: '/servicii', priority: 0.9 as const, changefreq: 'monthly' as const },
    { loc: '/booking', priority: 0.8 as const, changefreq: 'monthly' as const },
    ...services.map((s) => ({
      loc: `/servicii/${s.slug}`,
      priority: 0.8 as const,
      changefreq: 'monthly' as const,
    })),
  ]
})
