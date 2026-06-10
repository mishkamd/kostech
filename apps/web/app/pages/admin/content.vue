<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Content editor — Kostech Admin', robots: 'noindex,nofollow' })

interface StatItem { value: string; label: string }
interface HomepageContent {
  hero: { title: string; badge1: string; badge2: string; description: string; rating: string; location: string; ctaPhoneLabel: string; ctaTelegramLabel: string }
  stats: { title: string; items: StatItem[] }
  form: { title: string; namePlaceholder: string; phonePlaceholder: string; locationPlaceholder: string; descPlaceholder: string; dateLabel: string; submitLabel: string; submittingLabel: string; successTitle: string; successText: string; errorRequired: string; errorGeneric: string }
  services: { title: string; fromLabel: string; moreLabel: string }
  location: { title: string; city: string; mapsLabel: string; mapsUrl: string }
  cta: { title: string; heading: string; text: string; btnLabel: string }
  seo: { title: string; description: string }
  layoutOrder: string[]
}

const DEFAULT_SECTION_ORDER = ['hero', 'services', 'stats', 'form', 'contact', 'location', 'cta'] as const
const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero (profil)',
  services: 'Servicii principale',
  form: 'Formular comandă',
  location: 'Locație',
  cta: 'Programare rapidă',
  stats: 'Cifre',
  contact: 'Date de contact',
}

const locales = [
  { code: 'ro', label: 'Română' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

const activeLocale = ref<'ro' | 'ru' | 'en'>('ro')
const allContent = ref<Record<string, HomepageContent>>({} as Record<string, HomepageContent>)
const loading = ref(true)
const saving = ref(false)
const autoSaving = ref(false)
const savedMsg = ref('')
const errorMsg = ref('')
const router = useRouter()

const current = computed<HomepageContent | undefined>(() => allContent.value[activeLocale.value])

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<Record<string, HomepageContent>>('/api/admin/content/homepage')
    allContent.value = data
    if (ensureLayoutOrder()) _pendingOrderSync = true
  } catch (e: any) {
    if (e?.status === 401 || e?.statusCode === 401) {
      router.push('/admin/login')
      return
    }
    errorMsg.value = e?.data?.message || 'Eroare la încărcare'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!current.value) return
  saving.value = true
  savedMsg.value = ''
  errorMsg.value = ''
  try {
    await $fetch('/api/admin/content/homepage', {
      method: 'PUT',
      body: { lang: activeLocale.value, content: current.value },
    })
    savedMsg.value = `Salvat pentru ${activeLocale.value.toUpperCase()}`
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    if (e?.status === 401 || e?.statusCode === 401) {
      router.push('/admin/login')
      return
    }
    errorMsg.value = e?.data?.message || 'Eroare la salvare'
  } finally {
    saving.value = false
  }
}

function addStat() {
  current.value?.stats.items.push({ value: '', label: '' })
}
function removeStat(i: number) {
  current.value?.stats.items.splice(i, 1)
}

function ensureLayoutOrder(): boolean {
  // Pick first non-empty saved order across languages, else default — then apply to all
  const canonical = (['ro', 'ru', 'en'] as const)
    .map(l => allContent.value[l]?.layoutOrder)
    .find(o => Array.isArray(o) && o.length > 0)
    ?? [...DEFAULT_SECTION_ORDER]
  let changed = false
  for (const lang of Object.keys(allContent.value)) {
    const c = allContent.value[lang]
    if (c && JSON.stringify(c.layoutOrder) !== JSON.stringify(canonical)) {
      c.layoutOrder = [...canonical]
      changed = true
    }
  }
  return changed
}

const globalOrder = computed<string[]>(() =>
  allContent.value.ro?.layoutOrder ?? [...DEFAULT_SECTION_ORDER]
)

function syncAllLocalesOrder(newOrder: string[]) {
  for (const lang of Object.keys(allContent.value)) {
    const c = allContent.value[lang]
    if (c) c.layoutOrder = [...newOrder]
  }
}

async function saveAllLocales() {
  autoSaving.value = true
  try {
    await Promise.all(
      Object.keys(allContent.value).map(lang =>
        $fetch('/api/admin/content/homepage', {
          method: 'PUT',
          body: { lang, content: allContent.value[lang] },
        })
      )
    )
    savedMsg.value = 'Ordine salvată'
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    if (e?.status === 401 || e?.statusCode === 401) {
      router.push('/admin/login')
      return
    }
    errorMsg.value = e?.data?.message || 'Eroare la salvare ordine'
  } finally {
    autoSaving.value = false
  }
}

function moveSectionUp(i: number) {
  if (i === 0) return
  const order = [...globalOrder.value]
  ;[order[i - 1], order[i]] = [order[i]!, order[i - 1]!]
  syncAllLocalesOrder(order)
  saveAllLocales()
}

function moveSectionDown(i: number) {
  const order = [...globalOrder.value]
  if (i >= order.length - 1) return
  ;[order[i], order[i + 1]] = [order[i + 1]!, order[i]!]
  syncAllLocalesOrder(order)
  saveAllLocales()
}

let _pendingOrderSync = false

await load()

// If languages had diverged orders, persist the canonical order to KV after hydration
onMounted(() => {
  if (_pendingOrderSync) {
    _pendingOrderSync = false
    saveAllLocales()
  }
})

const previewUrl = computed(() => {
  const prefix = activeLocale.value === 'ro' ? '' : `/${activeLocale.value}`
  return `${prefix}/`
})
</script>

<template>
  <div>
    <!-- Toolbar -->
    <BentoCard class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">Editor pagina principală</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Editează conținutul în 3 limbi. Modificările sunt salvate per locale.</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink :to="previewUrl" target="_blank" class="text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover transition">
            <Icon name="fa6-solid:up-right-from-square" class="mr-1" /> Preview
          </NuxtLink>
          <button
            type="button"
            class="text-xs px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            :disabled="saving || loading"
            @click="save"
          >
            <Icon name="fa6-solid:floppy-disk" class="mr-1" />
            {{ saving ? 'Se salvează…' : 'Salvează' }}
          </button>
        </div>
      </div>

      <!-- Locale tabs -->
      <div class="flex gap-1 mt-5 bg-slate-50 dark:bg-dark-bg p-1 rounded-full w-fit border border-slate-100 dark:border-dark-border">
        <button
          v-for="loc in locales" :key="loc.code" type="button"
          class="px-4 py-1.5 rounded-full text-xs font-bold transition"
          :class="activeLocale === loc.code
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-primary'"
          @click="activeLocale = loc.code as 'ro' | 'ru' | 'en'"
        >
          {{ loc.label }}
        </button>
      </div>

      <p v-if="savedMsg" class="text-xs text-green-600 mt-3"><Icon name="fa6-solid:check" /> {{ savedMsg }}</p>
      <p v-if="errorMsg" class="text-xs text-red-500 mt-3">{{ errorMsg }}</p>
    </BentoCard>

    <div v-if="loading" class="text-center py-20 text-slate-500">
      <Icon name="fa6-solid:spinner" class="animate-spin text-2xl" />
    </div>

    <template v-else-if="current">
      <!-- Layout order -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Ordinea blocurilor</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Ordinea este aceeași pentru toate limbile. Modificările se salvează automat și sunt imediat vizibile pe pagina publică.</p>
        <div class="space-y-2">
          <div
            v-for="(key, i) in globalOrder"
            :key="key"
            class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border"
          >
            <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
            <span class="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200">{{ SECTION_LABELS[key] ?? key }}</span>
            <div class="flex gap-1">
              <button
                type="button"
                :disabled="i === 0"
                class="w-8 h-8 rounded-lg border border-slate-200 dark:border-dark-border flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                @click="moveSectionUp(i)"
              >
                <Icon name="fa6-solid:chevron-up" class="text-xs" />
              </button>
              <button
                type="button"
                :disabled="i === globalOrder.length - 1"
                class="w-8 h-8 rounded-lg border border-slate-200 dark:border-dark-border flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                @click="moveSectionDown(i)"
              >
                <Icon name="fa6-solid:chevron-down" class="text-xs" />
              </button>
            </div>
          </div>
        </div>
        <p v-if="autoSaving" class="text-xs text-slate-400 mt-3 flex items-center gap-1">
          <Icon name="fa6-solid:spinner" class="animate-spin" /> Se salvează...
        </p>
        <p v-else-if="savedMsg" class="text-xs text-green-600 mt-3 flex items-center gap-1">
          <Icon name="fa6-solid:check" /> {{ savedMsg }}
        </p>
      </BentoCard>

      <!-- Two-column grid -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Left col -->
        <div class="space-y-6">
          <!-- SEO -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">SEO</h2>
            <div class="space-y-3">
              <UiInput v-model="current.seo.title" label="Title (browser tab + Google)" id="seo-title" />
              <UiTextarea v-model="current.seo.description" :rows="2" label="Meta description" id="seo-desc" />
            </div>
          </BentoCard>

          <!-- Hero -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Hero (card cu profil)</h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <UiInput v-model="current.hero.title" label="Titlu" id="hero-title" />
              <UiInput v-model="current.hero.rating" label="Rating" id="hero-rating" />
              <UiInput v-model="current.hero.badge1" label="Badge 1" id="hero-b1" />
              <UiInput v-model="current.hero.badge2" label="Badge 2" id="hero-b2" />
              <UiInput v-model="current.hero.location" label="Locație" id="hero-loc" />
              <UiInput v-model="current.hero.ctaPhoneLabel" label="Buton telefon" id="hero-cta-phone" />
              <UiInput v-model="current.hero.ctaTelegramLabel" label="Buton Telegram" id="hero-cta-tg" />
            </div>
            <div class="mt-3">
              <UiTextarea v-model="current.hero.description" :rows="3" label="Descriere" id="hero-desc" />
            </div>
          </BentoCard>

          <!-- Form labels -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Formular comandă</h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <UiInput v-model="current.form.title" label="Titlu" id="f-title" />
              <UiInput v-model="current.form.dateLabel" label="Label dată" id="f-date" />
              <UiInput v-model="current.form.namePlaceholder" label="Placeholder nume" id="f-name" />
              <UiInput v-model="current.form.phonePlaceholder" label="Placeholder telefon" id="f-phone" />
              <UiInput v-model="current.form.locationPlaceholder" label="Placeholder locație" id="f-loc" />
              <UiInput v-model="current.form.descPlaceholder" label="Placeholder descriere" id="f-desc" />
              <UiInput v-model="current.form.submitLabel" label="Buton trimite" id="f-sub" />
              <UiInput v-model="current.form.submittingLabel" label="Text în timpul trimiterii" id="f-subng" />
              <UiInput v-model="current.form.successTitle" label="Titlu succes" id="f-st" />
              <UiInput v-model="current.form.successText" label="Text succes" id="f-stt" />
              <UiInput v-model="current.form.errorRequired" label="Eroare câmpuri obligatorii" id="f-er" />
              <UiInput v-model="current.form.errorGeneric" label="Eroare generică" id="f-eg" />
            </div>
          </BentoCard>
        </div>

        <!-- Right col -->
        <div class="space-y-6">
          <!-- Services -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Servicii (etichete)</h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <UiInput v-model="current.services.title" label="Titlu secțiune" id="srv-title" />
              <UiInput v-model="current.services.fromLabel" label="Etichetă „De la”" id="srv-from" />
              <UiInput v-model="current.services.moreLabel" label="Etichetă „Vezi mai multe”" id="srv-more" />
            </div>
          </BentoCard>

          <!-- Location -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Locație</h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <UiInput v-model="current.location.title" label="Titlu secțiune" id="loc-title" />
              <UiInput v-model="current.location.city" label="Oraș / țară" id="loc-city" />
              <UiInput v-model="current.location.mapsLabel" label="Text overlay hartă" id="loc-ml" />
              <UiInput v-model="current.location.mapsUrl" label="URL Google Maps" id="loc-mu" />
            </div>
          </BentoCard>

          <!-- Stats -->
          <BentoCard>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Cifre</h2>
              <button type="button" class="text-xs text-primary hover:underline" @click="addStat">
                <Icon name="fa6-solid:plus" /> Adaugă
              </button>
            </div>
            <UiInput v-model="current.stats.title" label="Titlu secțiune" id="stats-title" class="mb-4" />
            <div class="space-y-3">
              <div class="grid grid-cols-[1fr_2fr_auto] gap-2 items-end px-1">
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Valoare</p>
                <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Etichetă</p>
                <span aria-hidden="true" />
              </div>
              <div v-for="(item, i) in current.stats.items" :key="i" class="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                <UiInput v-model="item.value" :id="`stat-v-${i}`" />
                <UiInput v-model="item.label" :id="`stat-l-${i}`" />
                <button type="button" class="h-11 w-11 rounded-lg border border-slate-200 dark:border-dark-border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center" @click="removeStat(i)">
                  <Icon name="fa6-solid:trash" />
                </button>
              </div>
            </div>
          </BentoCard>

          <!-- CTA -->
          <BentoCard>
            <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">CTA (programare rapidă)</h2>
            <div class="grid sm:grid-cols-2 gap-3">
              <UiInput v-model="current.cta.title" label="Titlu" id="cta-title" />
              <UiInput v-model="current.cta.heading" label="Heading" id="cta-h" />
              <UiInput v-model="current.cta.btnLabel" label="Etichetă buton" id="cta-btn" />
            </div>
            <div class="mt-3">
              <UiTextarea v-model="current.cta.text" :rows="3" label="Text" id="cta-text" />
            </div>
          </BentoCard>
        </div>
      </div>

      <!-- Sticky save bar -->
      <div class="sticky bottom-4 z-10 flex justify-end">
        <div class="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
          <span class="text-xs text-slate-500">{{ activeLocale.toUpperCase() }}</span>
          <button
            type="button"
            class="text-xs px-4 py-1.5 rounded-full bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            :disabled="saving"
            @click="save"
          >
            <Icon name="fa6-solid:floppy-disk" class="mr-1" />
            {{ saving ? 'Se salvează…' : 'Salvează' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
