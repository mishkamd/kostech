<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()

const { data: services } = await useFetch('/api/content/services', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
  default: () => [],
})

const { data: content } = await useFetch('/api/content/homepage', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
})

const seoForLocale = computed(() => {
  const map = {
    ro: {
      title: 'Servicii IT — Kostech',
      description:
        'Lista completă de servicii IT oferite: mentenanță PC, administrare servere, proiectare rețele, securitate IT.',
    },
    ru: {
      title: 'IT-услуги — Kostech',
      description:
        'Полный список IT-услуг: обслуживание ПК, администрирование серверов, проектирование сетей, IT-безопасность.',
    },
    en: {
      title: 'IT Services — Kostech',
      description:
        'Full list of IT services: PC maintenance, server administration, network design, IT security.',
    },
  }
  return map[locale.value as 'ro' | 'ru' | 'en'] ?? map.ro
})

useSeoMeta({
  title: computed(() => seoForLocale.value.title),
  description: computed(() => seoForLocale.value.description),
  ogTitle: computed(() => seoForLocale.value.title),
  ogDescription: computed(() => seoForLocale.value.description),
  ogImage: '/og/servicii.png',
  twitterCard: 'summary_large_image',
  twitterImage: '/og/servicii.png',
})
</script>

<template>
  <div>
    <BentoCard class="!mb-6">
      <div class="text-center max-w-2xl mx-auto">
        <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">{{ t('serviciiPage.eyebrow') }}</p>
        <h1 class="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
          {{ t('serviciiPage.title') }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-3">
          {{ t('serviciiPage.subtitle') }}
        </p>
      </div>
    </BentoCard>

    <BentoGrid class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr [column-count:unset]">
      <BentoCard v-for="s in services" :key="s.slug" class="flex h-full sm:min-h-[22rem] flex-col">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-xl">
            <Icon :name="s.icon" />
          </div>
          <div class="min-w-0">
            <h3 class="font-bold text-lg text-slate-900 dark:text-white">{{ s.title }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ s.summary }}</p>
          </div>
        </div>
        <ul class="mt-5 space-y-2">
          <li v-for="f in s.features.slice(0, 3)" :key="f" class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Icon name="fa6-solid:check" class="text-primary mt-0.5 shrink-0" /> {{ f }}
          </li>
        </ul>
        <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-dark-border">
          <div class="text-sm font-bold text-primary">{{ content?.services?.fromLabel ?? t('serviciiPage.from') }} {{ s.priceFrom }} {{ s.currency }}</div>
          <UiButton :to="localePath(`/servicii/${s.slug}`)" variant="outline" size="sm">
            {{ t('serviciiPage.details') }} <Icon name="fa6-solid:arrow-right" />
          </UiButton>
        </div>
      </BentoCard>
    </BentoGrid>
  </div>
</template>
