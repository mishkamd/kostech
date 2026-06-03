<script setup lang="ts">
import { services } from '~/content/services'

const { locale } = useI18n()

// Fetch homepage content for current locale (server merges KV override + defaults)
const { data: content } = await useFetch('/api/content/homepage', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
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

const today = new Date()
const dates = Array.from({ length: 5 }).map((_, i) => {
  const d = new Date(today)
  d.setDate(today.getDate() + i)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase().replace('.', ''),
    iso: d.toISOString().slice(0, 10),
  }
})
const selected = ref(dates[1]?.iso)

const form = reactive({ name: '', phone: '', location: '', description: '' })
const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

// ── Attachments ──────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 3

const attachments = ref<File[]>([])
const imageInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function pickImages() { imageInputRef.value?.click() }
function pickFiles() { fileInputRef.value?.click() }

function handleFileInput(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  input.value = ''
}

function addFiles(files: File[]) {
  for (const f of files) {
    if (attachments.value.length >= MAX_FILES) {
      errorMsg.value = `Maxim ${MAX_FILES} fișiere permise.`
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      errorMsg.value = `Tip nepermis: ${f.name}. Sunt permise imagini și PDF.`
      return
    }
    if (f.size > MAX_SIZE) {
      errorMsg.value = `Fișierul ${f.name} depășește 5 MB.`
      return
    }
    attachments.value = [...attachments.value, f]
  }
  errorMsg.value = ''
}

function removeAttachment(idx: number) {
  attachments.value = attachments.value.filter((_, i) => i !== idx)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix (e.g. "data:image/png;base64,")
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const submit = async () => {
  errorMsg.value = ''
  if (!form.name || !form.phone) {
    errorMsg.value = content.value?.form?.errorRequired ?? 'Te rugăm să completezi numele și telefonul.'
    return
  }
  submitting.value = true
  try {
    const attachmentPayload = attachments.value.length
      ? await Promise.all(
          attachments.value.map(async (f) => ({
            name: f.name,
            type: f.type,
            size: f.size,
            data: await fileToBase64(f),
          })),
        )
      : undefined

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
  <BentoGrid class="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-stretch">
    <!-- 1. Profile / Hero card -->
    <BentoCard flush class="flex flex-col">
      <div class="h-36 w-full relative bg-slate-100 dark:bg-dark-bg shrink-0">
        <NuxtImg
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"
          alt="Server room"
          class="w-full h-full object-cover"
          width="800" height="400"
          loading="eager" fetchpriority="high"
        />
      </div>
      <div class="p-6 relative flex flex-col flex-1">
        <div class="w-20 h-20 bg-slate-900 dark:bg-dark-bg rounded-full absolute -top-10 left-6 border-4 border-white dark:border-dark-card flex items-center justify-center text-white shadow-md">
          <Icon name="fa6-solid:microchip" class="text-3xl" />
          <div class="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px]">
            <Icon name="fa6-solid:check" class="text-white" />
          </div>
        </div>
        <h1 class="text-2xl font-bold mt-6 text-slate-900 dark:text-white">{{ content?.hero?.title ?? 'Kostech' }}</h1>
        <div class="flex gap-2 mt-2 mb-4">
          <UiBadge>{{ content?.hero?.badge1 ?? 'Mentenanță' }}</UiBadge>
          <UiBadge>{{ content?.hero?.badge2 ?? 'Securitate' }}</UiBadge>
        </div>
        <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1">
          {{ content?.hero?.description }}
        </p>
        <div class="flex items-center gap-6 mb-6 text-sm">
          <div class="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <Icon name="fa6-solid:star" class="text-yellow-500" />
            <span>{{ content?.hero?.rating ?? '4.95' }}</span>
          </div>
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Icon name="fa6-regular:paper-plane" />
            <span>{{ content?.hero?.location ?? 'Chișinău, Moldova' }}</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-auto">
          <UiButton href="tel:+37378643740" variant="outline">
            <Icon name="fa6-solid:phone" /> {{ content?.hero?.ctaPhoneLabel ?? 'Sună-ne' }}
          </UiButton>
          <UiButton href="https://t.me/kostech" variant="outline">
            <Icon name="fa6-brands:telegram" /> {{ content?.hero?.ctaTelegramLabel ?? 'Telegram' }}
          </UiButton>
        </div>
      </div>
    </BentoCard>

    <!-- 2. Services -->
    <BentoCard class="lg:col-span-2 flex flex-col justify-between">
      <div>
        <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">{{ content?.services?.title ?? 'Servicii principale' }}</h3>
        <div class="space-y-1">
          <NuxtLink
            v-for="s in services.slice(0, 5)" :key="s.slug"
            :to="localePath(`/servicii/${s.slug}`)"
            class="group flex justify-between items-center p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-hover border border-transparent transition-all"
          >
          <div class="flex items-center gap-3 md:gap-4 overflow-hidden">
            <div class="w-10 h-10 shrink-0 rounded-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-primary text-lg transition-colors">
              <Icon :name="s.icon" />
            </div>
            <div class="truncate">
              <h4 class="text-sm font-bold text-slate-900 dark:text-white truncate">{{ s.title }}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{ s.short }}</p>
            </div>
          </div>
          <div class="ml-3 shrink-0 bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap">
            {{ content?.services?.fromLabel ?? 'De la' }} {{ s.priceFrom }} {{ s.currency }}
          </div>
        </NuxtLink>
      </div>
      </div>
      <div class="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end">
        <NuxtLink :to="localePath('/servicii')" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          {{ content?.services?.moreLabel ?? 'Vezi mai multe servicii' }}
          <Icon name="fa6-solid:arrow-right" class="text-xs" />
        </NuxtLink>
      </div>
    </BentoCard>

    <!-- 3. Order form -->
    <BentoCard>
      <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5 flex items-center justify-between w-full">
        <span>{{ content?.form?.title ?? 'Solicită o comandă' }}</span>
        <Icon name="fa6-solid:file-signature" class="text-lg" />
      </h3>
      <div v-if="submitted" class="text-center py-10">
        <div class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Icon name="fa6-solid:check" class="text-2xl" />
        </div>
        <p class="font-semibold text-slate-900 dark:text-white">{{ content?.form?.successTitle ?? 'Mulțumim!' }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ content?.form?.successText }}</p>
      </div>
      <form v-else class="space-y-3" @submit.prevent="submit">
        <UiInput v-model="form.name" :placeholder="content?.form?.namePlaceholder ?? 'Numele tău'" required />
        <UiInput v-model="form.phone" type="tel" :placeholder="content?.form?.phonePlaceholder ?? 'Telefonul tău'" required />
        <UiInput v-model="form.location" :placeholder="content?.form?.locationPlaceholder ?? 'Locația'" />
        <UiTextarea v-model="form.description" :rows="3" :placeholder="content?.form?.descPlaceholder ?? 'Descrie problema...'" />
        <div>
          <div class="text-sm font-semibold mt-2 mb-3 dark:text-slate-300">{{ content?.form?.dateLabel ?? 'Alege data dorită' }}</div>
          <div class="flex justify-between gap-2">
            <button
              v-for="d in dates" :key="d.iso" type="button"
              class="flex flex-col items-center justify-center p-2 rounded-xl border min-w-[3rem] transition"
              :class="selected === d.iso
                ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10 text-primary shadow-sm'
                : 'border-slate-100 bg-slate-50 dark:bg-dark-bg dark:border-dark-border text-slate-800 dark:text-slate-300 hover:border-primary/50'"
              @click="selected = d.iso"
            >
              <span class="text-[10px] font-bold uppercase">{{ d.month }}</span>
              <span class="text-lg font-bold">{{ d.day }}</span>
            </button>
          </div>
        </div>
        <p v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</p>
        <div v-if="attachments.length" class="flex flex-wrap gap-2">
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
        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-border">
          <div class="flex gap-2">
            <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" @change="handleFileInput" />
            <input ref="fileInputRef" type="file" accept="application/pdf" multiple class="hidden" @change="handleFileInput" />
            <button type="button" aria-label="Atașează imagine" class="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-400 flex items-center justify-center transition" :class="attachments.length >= MAX_FILES ? 'opacity-40 cursor-not-allowed' : ''" :disabled="attachments.length >= MAX_FILES" @click="pickImages">
              <Icon name="fa6-regular:image" />
            </button>
            <button type="button" aria-label="Atașează fișier PDF" class="w-8 h-8 rounded-full hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-400 flex items-center justify-center transition" :class="attachments.length >= MAX_FILES ? 'opacity-40 cursor-not-allowed' : ''" :disabled="attachments.length >= MAX_FILES" @click="pickFiles">
              <Icon name="fa6-solid:paperclip" />
            </button>
          </div>
          <UiButton type="submit" :disabled="submitting">
            {{ submitting ? (content?.form?.submittingLabel ?? 'Se trimite…') : (content?.form?.submitLabel ?? 'Trimite comanda') }}
          </UiButton>
        </div>
      </form>
    </BentoCard>

    <div class="flex flex-col gap-6">
      <!-- 4. Location -->
      <BentoCard>
        <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">{{ content?.location?.title ?? 'Locație' }}</h3>
        <h4 class="font-bold text-base mb-4 text-slate-900 dark:text-white">{{ content?.location?.city ?? 'Chișinău, Republica Moldova' }}</h4>
        <a
          :href="content?.location?.mapsUrl ?? 'https://maps.app.goo.gl/MAqnSnd3QdHuKNtv6'"
          target="_blank" rel="noopener noreferrer"
          class="block h-32 bg-slate-100 dark:bg-dark-bg rounded-2xl relative overflow-hidden border border-slate-200 dark:border-dark-border group cursor-pointer transition-all hover:border-primary/50 shadow-sm hover:shadow-md"
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
  
      <!-- 6. CTA -->
      <BentoCard class="flex-1">
        <div class="flex flex-col h-full">
          <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">{{ content?.cta?.title ?? 'Programare rapidă' }}</h3>
          <h4 class="font-bold text-xl text-slate-900 dark:text-white mb-2">{{ content?.cta?.heading ?? 'Diagnoză gratuită' }}</h4>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
            {{ content?.cta?.text }}
          </p>
          <UiButton :to="localePath('/booking')" block>
            {{ content?.cta?.btnLabel ?? 'Programează acum' }} <Icon name="fa6-solid:arrow-right" />
          </UiButton>
        </div>
      </BentoCard>
    </div>

    <div class="flex flex-col gap-6">
      <!-- 5. Stats -->
      <BentoCard>
        <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">{{ content?.stats?.title ?? 'Cifre' }}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="item in (content?.stats?.items ?? [])" :key="item.label">
            <div class="text-3xl font-bold text-slate-900 dark:text-white">{{ item.value }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.label }}</div>
          </div>
        </div>
      </BentoCard>
  
      <!-- 7. Contact info -->
      <BentoCard class="flex-1">
        <h3 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Date de contact</h3>
        <ul class="space-y-4 text-sm">
          <li class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="fa6-solid:phone" />
            </div>
            <a href="tel:+37378643740" class="font-semibold text-slate-900 dark:text-white">+373 78 643 740</a>
          </li>
          <li class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="fa6-solid:envelope" />
            </div>
            <a href="mailto:hello@kostech.md" class="font-semibold text-slate-900 dark:text-white">hello@kostech.md</a>
          </li>
          <li class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="fa6-brands:telegram" />
            </div>
            <a href="https://t.me/kostech" class="font-semibold text-slate-900 dark:text-white">@kostech</a>
          </li>
          <li class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="fa6-regular:paper-plane" />
            </div>
            <span class="text-slate-600 dark:text-slate-300">Chișinău, Moldova</span>
          </li>
        </ul>
      </BentoCard>
    </div>
  </BentoGrid>
</template>

<style scoped>
@media (min-width: 1024px) {
  :deep(.bento-item) {
    margin-bottom: 0;
  }
}
</style>
