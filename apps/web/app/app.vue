<script setup lang="ts">
const { locale } = useI18n()

const localeHead = useLocaleHead({ seo: true })
useHead(localeHead)

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://kostech.md/#organization',
        name: 'Kostech',
        url: 'https://kostech.md',
        logo: 'https://kostech.md/favicon.svg',
        image: 'https://kostech.md/og/home.png',
        description: 'Servicii IT, mentenanță PC și laptop, administrare servere și rețele în Chișinău, Moldova.',
        telephone: '+37378643740',
        email: 'contact@kostech.md',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chișinău',
          addressCountry: 'MD',
        },
        areaServed: { '@type': 'Country', name: 'Moldova' },
        priceRange: '$$',
        sameAs: ['https://kostech.md'],
      }),
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage :key="locale" />
  </NuxtLayout>
</template>
