<script setup lang="ts">
const { locale, t } = useI18n()

// Fetch homepage content for current locale (server merges KV override + defaults)
const { data: content } = await useFetch('/api/content/homepage', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
})

// Fetch services for current locale
const { data: services } = await useFetch('/api/content/services', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
  default: () => [],
})

useSeoMeta({
  title: computed(() => content.value?.seo?.title ?? 'Kostech'),
  description: computed(() => content.value?.seo?.description ?? ''),
  ogTitle: computed(() => content.value?.seo?.title ?? 'Kostech'),
  ogDescription: computed(() => content.value?.seo?.description ?? ''),
  ogType: 'website',
  ogImage: '/og/home.png',
  twitterCard: 'summary_large_image',
  twitterImage: '/og/home.png',
})

const localePath = useLocalePath()

const DEFAULT_ORDER = ['hero', 'services', 'form', 'contact', 'location', 'stats']

const defaultStats = [
  { value: '500+', label: 'Clienți mulțumiți' },
  { value: '8 ani', label: 'Experiență' },
  { value: '1h', label: 'Răspuns mediu' },
  { value: '24/7', label: 'Suport critic' },
]
const orderedSections = computed(() =>
  content.value?.layoutOrder?.length ? [...content.value.layoutOrder] : DEFAULT_ORDER
)

const today = new Date()
const dates = Array.from({ length: 4 }).map((_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() + i)
  const dateLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'ro-RO'
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(dateLocale, { month: 'short' }).toUpperCase().replace('.', ''),
    iso: d.toISOString().slice(0, 10),
  }
})
const selected = ref(dates[1]?.iso)

const form = reactive({ name: '', phone: '', location: '', description: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

const {
  attachments, error: attachmentError,
  imageInputRef, fileInputRef,
  pickImages, pickFiles, handleFileInput,
  removeAttachment, buildAttachmentPayload,
  isMaxed, MAX_FILES,
} = useAttachments()

const submit = async () => {
  errorMsg.value = ''
  if (!form.name || !form.phone) {
    errorMsg.value = content.value?.form?.errorRequired ?? 'Te rugăm să completezi numele și telefonul.'
    return
  }
  submitting.value = true
  try {
    const attachmentPayload = await buildAttachmentPayload()

    await $fetch('/api/contact', {
      method: 'POST',
      body: { ...form, scheduledAt: selected.value, source: 'home', attachments: attachmentPayload },
    })
    submitted.value = true
  } catch (e: any) {
    errorMsg.value = e?.data?.message || (content.value?.form?.errorGeneric ?? 'A apărut o eroare.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- ── Enterprise Hero ──────────────────────────────────────────────────── -->
  <section class="relative overflow-hidden rounded-bento border border-slate-800/50 bg-slate-900 dark:bg-[#0f0d18] dark:border-dark-border mb-6">
    <!-- Dot grid texture -->
    <div
      class="absolute inset-0 pointer-events-none opacity-40"
      style="background-image: radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 22px 22px;"
    />
    <!-- Left glow -->
    <div
      class="absolute inset-0 pointer-events-none"
      style="background: radial-gradient(ellipse 55% 75% at 5% 50%, rgba(99,91,255,0.2) 0%, transparent 65%)"
    />
    <!-- Right fade -->
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-slate-900/60 dark:to-[#0f0d18]/60" />

    <div class="relative px-7 sm:px-12 lg:px-16 py-12 sm:py-18 lg:py-22 flex items-center gap-8 lg:gap-12">
      <!-- Left: text content -->
      <div class="flex-1 min-w-0">
      <!-- Eyebrow -->
      <div class="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        <span class="text-[11px] font-semibold text-slate-300/80 uppercase tracking-[0.15em]">IT Services · Chișinău</span>
      </div>

      <!-- Headline -->
      <h1 class="font-heading font-bold text-white leading-[1.05] tracking-tight max-w-3xl" style="font-size: clamp(2.1rem, 5vw, 4rem)">
        {{ content?.hero?.title ?? 'Kostech' }}
      </h1>

      <!-- Service badges -->
      <div class="flex flex-wrap gap-2 mt-4">
        <span
          v-if="content?.hero?.badge1"
          class="text-[11px] font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/25"
        >{{ content.hero.badge1 }}</span>
        <span
          v-if="content?.hero?.badge2"
          class="text-[11px] font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/25"
        >{{ content.hero.badge2 }}</span>
      </div>

      <!-- Description -->
      <p class="mt-5 text-slate-300/75 leading-relaxed max-w-xl" style="font-size: clamp(0.875rem, 1.4vw, 1rem)">
        {{ content?.hero?.description }}
      </p>

      <!-- CTAs -->
      <div class="mt-8 flex flex-wrap gap-3">
        <UiButton :to="localePath('/booking')" size="lg">
          {{ content?.cta?.btnLabel ?? 'Programare rapidă' }}
          <Icon name="fa6-solid:arrow-right" />
        </UiButton>
        <a
          href="tel:+37378643740"
          class="inline-flex items-center gap-2 min-h-12 px-7 text-base rounded-xl font-semibold transition border border-white/15 text-slate-200 hover:bg-white/8 hover:border-white/25"
        >
          <Icon name="fa6-solid:phone" class="text-sm" />
          {{ content?.hero?.ctaPhoneLabel ?? 'Sună-ne' }}
        </a>
      </div>

      </div><!-- /left col -->

      <!-- Right: pc2.svg illustration -->
      <div class="hidden lg:flex shrink-0 w-80 xl:w-[26rem] items-center justify-center pointer-events-none select-none">
        <img src="/pc2.svg" alt="" class="w-full h-auto drop-shadow-2xl" draggable="false" />
      </div>
    </div>
  </section>

  <!-- ── Bento Grid ────────────────────────────────────────────────────── -->
  <BentoGrid>
    <template v-for="key in orderedSections" :key="key">

    <!-- Services -->
    <BentoCard v-if="key === 'services'" class="lg:col-span-2 flex flex-col justify-between">
      <div>
        <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4 sm:mb-5">{{ content?.services?.title ?? 'Servicii principale' }}</h3>
        <div class="space-y-0">
          <NuxtLink
            v-for="s in services" :key="s.slug"
            :to="localePath(`/servicii/${s.slug}`)"
            class="group flex justify-between items-center py-2 px-2.5 sm:px-3 -mx-2.5 sm:-mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-hover border border-transparent transition-all"
          >
          <div class="flex items-center gap-2.5 sm:gap-3 md:gap-4 overflow-hidden">
            <div class="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary text-base sm:text-lg transition-colors">
              <Icon :name="s.icon" />
            </div>
            <div class="truncate">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ s.title }}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ s.short }}</p>
            </div>
          </div>
          <div class="ml-2 sm:ml-3 shrink-0 bg-primary/10 dark:bg-primary/20 text-primary px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap">
            {{ content?.services?.fromLabel ?? 'De la' }} {{ s.priceFrom }} {{ s.currency }}
          </div>
        </NuxtLink>
      </div>
      </div>
      <div class="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end">
        <NuxtLink :to="localePath('/servicii')" class="inline-flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          {{ content?.services?.moreLabel ?? 'Vezi mai multe servicii' }}
          <Icon name="fa6-solid:arrow-right" class="text-xs" />
        </NuxtLink>
      </div>
    </BentoCard>

    <!-- Form -->
    <BentoCard v-else-if="key === 'form'" class="lg:min-h-[460px] flex flex-col">
      <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4 sm:mb-5 flex items-center justify-between w-full">
        <span>{{ content?.form?.title ?? 'Solicită o comandă' }}</span>
        <Icon name="fa6-solid:file-signature" class="text-lg" />
      </h3>
      <div v-if="submitted" class="text-center py-8 sm:py-10">
        <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Icon name="fa6-solid:check" class="text-xl sm:text-2xl" />
        </div>
        <p class="font-semibold text-slate-900 dark:text-white">{{ content?.form?.successTitle ?? 'Mulțumim!' }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ content?.form?.successText }}</p>
      </div>
      <form v-else class="space-y-2 flex flex-col flex-1" @submit.prevent="submit">
        <UiInput v-model="form.name" :placeholder="content?.form?.namePlaceholder ?? 'Numele tău'" required />
        <UiInput v-model="form.phone" type="tel" :placeholder="content?.form?.phonePlaceholder ?? 'Telefonul tău'" required />
        <UiInput v-model="form.location" :placeholder="content?.form?.locationPlaceholder ?? 'Locația'" />
        <UiTextarea v-model="form.description" :rows="2" :placeholder="content?.form?.descPlaceholder ?? 'Descrie problema...'" />
        <div>
          <div class="text-sm font-semibold mt-1.5 sm:mt-2 mb-2 sm:mb-3 dark:text-slate-300">{{ content?.form?.dateLabel ?? 'Alege data dorită' }}</div>
          <div class="flex justify-between gap-1.5 sm:gap-2">
            <button
              v-for="d in dates" :key="d.iso" type="button"
              class="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border flex-1 transition"
              :class="selected === d.iso
                ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10 text-primary shadow-sm'
                : 'border-slate-100 bg-slate-50 dark:bg-dark-bg dark:border-dark-border text-slate-800 dark:text-slate-300 hover:border-primary/50'"
              @click="selected = d.iso"
            >
              <span class="text-[10px] font-bold uppercase">{{ d.month }}</span>
              <span class="text-base sm:text-lg font-bold">{{ d.day }}</span>
            </button>
          </div>
        </div>
        <p v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</p>
        <p v-if="attachmentError" class="text-xs text-red-500">{{ attachmentError }}</p>
        <div v-if="attachments.length" class="flex flex-wrap gap-1.5 sm:gap-2">
          <div
            v-for="(f, idx) in attachments"
            :key="idx"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs text-slate-600 dark:text-slate-300"
          >
            <Icon :name="f.type === 'application/pdf' ? 'fa6-solid:file-pdf' : 'fa6-regular:image'" class="text-slate-400 shrink-0" />
            <span class="max-w-[120px] truncate">{{ f.name }}</span>
            <button type="button" class="ml-0.5 text-slate-400 hover:text-red-500 transition" @click="removeAttachment(idx)">
              <Icon name="fa6-solid:xmark" class="text-[10px]" />
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between pt-3 sm:pt-4 mt-auto border-t border-slate-100 dark:border-dark-border">
          <div class="flex gap-1.5 sm:gap-2">
            <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" @change="handleFileInput" />
            <input ref="fileInputRef" type="file" accept="application/pdf" multiple class="hidden" @change="handleFileInput" />
            <button type="button" aria-label="Atașează imagine" class="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-400 flex items-center justify-center transition" :class="isMaxed ? 'opacity-40 cursor-not-allowed' : ''" :disabled="isMaxed" @click="pickImages">
              <Icon name="fa6-regular:image" />
            </button>
            <button type="button" aria-label="Atașează fișier PDF" class="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-400 flex items-center justify-center transition" :class="isMaxed ? 'opacity-40 cursor-not-allowed' : ''" :disabled="isMaxed" @click="pickFiles">
              <Icon name="fa6-solid:paperclip" />
            </button>
          </div>
          <UiButton type="submit" :disabled="submitting">
            {{ submitting ? (content?.form?.submittingLabel ?? 'Se trimite…') : (content?.form?.submitLabel ?? 'Trimite comanda') }}
          </UiButton>
        </div>
      </form>
    </BentoCard>

    <!-- Location -->
    <BentoCard v-else-if="key === 'location'" class="h-full">
      <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">{{ content?.location?.title ?? 'Locație' }}</h3>
        <h4 class="font-bold text-sm mb-3 text-slate-900 dark:text-white">{{ content?.location?.city ?? 'Chișinău, Republica Moldova' }}</h4>
        <a
          :href="content?.location?.mapsUrl ?? 'https://maps.app.goo.gl/MAqnSnd3QdHuKNtv6'"
          target="_blank" rel="noopener noreferrer"
          class="block h-24 sm:h-28 bg-slate-100 dark:bg-dark-bg rounded-2xl relative overflow-hidden border border-slate-200 dark:border-dark-border group cursor-pointer transition-all hover:border-primary/50 shadow-sm hover:shadow-md"
        >
          <img
            src="https://www.transparenttextures.com/patterns/cartographer.png"
            alt="" class="w-full h-full object-cover opacity-20 dark:opacity-10 dark:invert group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          >
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
              <div class="w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-dark-bg shadow-md group-hover:scale-125 transition-transform duration-300" />
            </div>
          </div>
          <div class="absolute inset-0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
            <span class="opacity-0 group-hover:opacity-100 bg-white dark:bg-dark-card text-primary font-bold text-xs px-4 py-2 rounded-full shadow-sm translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Icon name="fa6-solid:map-location-dot" class="mr-1" /> {{ content?.location?.mapsLabel ?? 'Deschide Google Maps' }}
            </span>
          </div>
        </a>
    </BentoCard>
  
    <!-- Contact -->
    <BentoCard v-else-if="key === 'contact'" class="h-full">
      <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3 sm:mb-4">Date de contact</h3>
        <ul class="space-y-2.5 sm:space-y-3 text-sm">
          <li class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="fa6-solid:phone" />
            </div>
            <a href="tel:+37378643740" class="font-semibold text-slate-900 dark:text-white">+373 78 643 740</a>
          </li>
          <li class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="fa6-solid:envelope" />
            </div>
            <a href="mailto:hello@kostech.md" class="font-semibold text-slate-900 dark:text-white">hello@kostech.md</a>
          </li>
          <li class="flex items-center gap-2.5 sm:gap-3">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="fa6-brands:telegram" />
            </div>
            <a href="https://t.me/kostech" class="font-semibold text-slate-900 dark:text-white">@kostech</a>
          </li>
        </ul>
    </BentoCard>

    <!-- Stats -->
    <BentoCard v-else-if="key === 'stats'" class="h-full flex flex-col">
      <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">
        {{ content?.stats?.title ?? 'Cifre' }}
      </h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-5 flex-1">
        <div v-for="item in (content?.stats?.items ?? defaultStats)" :key="item.label">
          <div class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-none">
            {{ item.value }}
          </div>
          <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            {{ item.label }}
          </div>
        </div>
      </div>
    </BentoCard>
    </template>
  </BentoGrid>
</template>
