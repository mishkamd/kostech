<script setup lang="ts">
import { services, getService } from '~/content/services'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const service = computed(() => getService(slug.value))

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: 'Serviciu inexistent', fatal: true })
}

const related = computed(() => services.filter((s) => s.slug !== slug.value))

useSeoMeta({
  title: () => `${service.value!.title} — Kostech`,
  description: () => service.value!.summary,
  ogTitle: () => service.value!.title,
  ogDescription: () => service.value!.summary,
  ogImage: () => `/og/${service.value!.slug}.png`,
  twitterCard: 'summary_large_image',
  twitterImage: () => `/og/${service.value!.slug}.png`,
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.value!.title,
          description: service.value!.summary,
          provider: { '@type': 'LocalBusiness', name: 'Kostech', telephone: '+37378643740', areaServed: 'MD' },
          offers: { '@type': 'Offer', price: service.value!.priceFrom, priceCurrency: service.value!.currency },
        }),
      ),
    },
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: service.value!.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      ),
    },
  ],
})

const openFaq = ref<number | null>(0)
</script>

<template>
  <div v-if="service">
    <BentoCard class="!mb-6">
      <div class="flex items-start gap-5">
        <div class="w-16 h-16 shrink-0 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-3xl">
          <Icon :name="service.icon" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[11px] font-bold text-primary uppercase tracking-wider">Serviciu</p>
          <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1">{{ service.title }}</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-2">{{ service.summary }}</p>
        </div>
        <div class="hidden md:flex flex-col items-end gap-2">
          <div class="bg-primary/10 dark:bg-primary/20 text-primary px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap">
            De la {{ service.priceFrom }} {{ service.currency }}
          </div>
          <UiButton to="/booking">Programează</UiButton>
        </div>
      </div>
    </BentoCard>

    <BentoGrid>
      <BentoCard>
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Ce includem</h2>
        <ul class="space-y-3">
          <li v-for="f in service.features" :key="f" class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
            <Icon name="fa6-solid:circle-check" class="text-primary mt-0.5 shrink-0 text-base" /> {{ f }}
          </li>
        </ul>
      </BentoCard>

      <BentoCard>
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Întrebări frecvente</h2>
        <div class="space-y-2">
          <div v-for="(faq, i) in service.faqs" :key="faq.q" class="border border-slate-100 dark:border-dark-border rounded-2xl overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-hover"
              @click="openFaq = openFaq === i ? null : i"
            >
              {{ faq.q }}
              <Icon :name="openFaq === i ? 'fa6-solid:minus' : 'fa6-solid:plus'" class="text-primary text-xs" />
            </button>
            <div v-show="openFaq === i" class="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">
              {{ faq.a }}
            </div>
          </div>
        </div>
      </BentoCard>

      <BentoCard>
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Servicii conexe</h2>
        <div class="space-y-2">
          <NuxtLink
            v-for="r in related"
            :key="r.slug"
            :to="`/servicii/${r.slug}`"
            class="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-hover transition"
          >
            <div class="w-10 h-10 shrink-0 rounded-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Icon :name="r.icon" />
            </div>
            <div class="min-w-0">
              <div class="font-semibold text-sm text-slate-900 dark:text-white truncate">{{ r.title }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ r.short }}</div>
            </div>
          </NuxtLink>
        </div>
      </BentoCard>
    </BentoGrid>
  </div>
</template>
