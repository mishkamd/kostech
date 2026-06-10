<script setup lang="ts">
import type { Service } from '~~/app/content/services'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Servicii — Kostech Admin' })

const { t } = useI18n()
const saving = ref(false)
const saved = ref(false)

const currentLang = ref<'ro' | 'ru' | 'en'>('ro')
const allData = ref<Record<'ro' | 'ru' | 'en', Service[]>>({ ro: [], ru: [], en: [] })

// Load on mount
onMounted(async () => {
  const data = await $fetch('/api/admin/content/services')
  allData.value = data
})

const services = computed(() => allData.value[currentLang.value])

// Expand state
const expandedSlugs = ref<Set<string>>(new Set())

function toggleExpand(slug: string) {
  if (expandedSlugs.value.has(slug)) expandedSlugs.value.delete(slug)
  else expandedSlugs.value.add(slug)
}

// Local edit helpers
function updateService(slug: string, patch: Partial<Service>) {
  const arr = allData.value[currentLang.value]
  const idx = arr.findIndex(s => s.slug === slug)
  if (idx < 0) return
  const existing = arr[idx]
  if (!existing) return
  arr[idx] = { ...existing, ...patch } as Service
}

function updateFeature(slug: string, fi: number, val: string) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  if (svc) svc.features[fi] = val
}
function addFeature(slug: string) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  if (svc) svc.features.push('')
}
function removeFeature(slug: string, fi: number) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  if (svc) svc.features.splice(fi, 1)
}

function updateFaq(slug: string, fi: number, key: 'q' | 'a', val: string) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  const faq = svc?.faqs[fi]
  if (faq) faq[key] = val
}
function addFaq(slug: string) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  if (svc) svc.faqs.push({ q: '', a: '' })
}
function removeFaq(slug: string, fi: number) {
  const svc = (allData.value[currentLang.value] as Service[]).find(s => s.slug === slug)
  if (svc) svc.faqs.splice(fi, 1)
}

async function save() {
  saving.value = true
  saved.value = false
  try {
    await $fetch('/api/admin/content/services', {
      method: 'PUT',
      body: { lang: currentLang.value, services: allData.value[currentLang.value] },
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header + Lang Tabs -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Servicii</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Editare conținut pentru {{ currentLang.toUpperCase() }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="lang in (['ro', 'ru', 'en'] as const)"
          :key="lang"
          class="px-3 py-1.5 text-sm rounded-full border transition-colors"
          :class="currentLang === lang
            ? 'bg-primary text-white border-primary'
            : 'bg-white dark:bg-dark-card text-slate-600 dark:text-slate-300 border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-hover'"
          @click="currentLang = lang"
        >{{ lang.toUpperCase() }}</button>
        <button
          class="ml-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          :disabled="saving"
          @click="save"
        >
          <Icon v-if="saving" name="fa6-solid:spinner" class="text-xs animate-spin" />
          <Icon v-else-if="saved" name="fa6-solid:check" class="text-xs" />
          <Icon v-else name="fa6-solid:save" class="text-xs" />
          {{ saved ? 'Salvat!' : saving ? 'Se salvează…' : 'Salvează' }}
        </button>
      </div>
    </div>

    <!-- Service cards -->
    <div class="space-y-4">
      <template v-for="svc in services" :key="svc.slug">
        <div class="bg-white dark:bg-dark-card rounded-bento border border-slate-200 dark:border-dark-border shadow-card dark:shadow-dark-card overflow-hidden">
          <!-- Card header -->
          <button
            class="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
            @click="toggleExpand(svc.slug)"
          >
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-sm">
                <Icon :name="svc.icon || 'fa6-solid:wrench'" />
              </div>
              <div class="text-left">
                <span class="font-medium text-slate-800 dark:text-slate-100">{{ svc.title }}</span>
                <span class="ml-3 text-xs text-slate-400 font-mono">{{ svc.slug }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-slate-500">De la {{ svc.priceFrom }} {{ svc.currency }}</span>
              <a
                :href="`/servicii/${svc.slug}`"
                target="_blank"
                rel="noopener"
                class="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                @click.stop
              >
                <Icon name="fa6-solid:arrow-up-right-from-square" class="text-[10px]" />
                Vezi
              </a>
              <Icon
                :name="expandedSlugs.has(svc.slug) ? 'fa6-solid:chevron-up' : 'fa6-solid:chevron-down'"
                class="text-slate-400 text-sm"
              />
            </div>
          </button>

          <!-- Expanded editor -->
          <div v-if="expandedSlugs.has(svc.slug)" class="border-t border-slate-100 dark:border-dark-border p-5 space-y-5">

            <!-- Core fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Titlu</label>
                <UiInput :model-value="svc.title" @update:model-value="updateService(svc.slug, { title: $event })" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Icon (FontAwesome class)</label>
                <UiInput :model-value="svc.icon" @update:model-value="updateService(svc.slug, { icon: $event })" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Scurt (subtitlu)</label>
                <UiInput :model-value="svc.short" @update:model-value="updateService(svc.slug, { short: $event })" />
              </div>
              <div class="flex items-end gap-3">
                <div class="flex-1">
                  <label class="block text-xs font-medium text-slate-500 mb-1">Preț de la</label>
                  <UiInput type="number" :model-value="svc.priceFrom" @update:model-value="updateService(svc.slug, { priceFrom: Number($event) })" />
                </div>
                <div class="w-24">
                  <label class="block text-xs font-medium text-slate-500 mb-1">Valută</label>
                  <UiInput :model-value="svc.currency" @update:model-value="updateService(svc.slug, { currency: $event })" />
                </div>
              </div>
            </div>

            <!-- Summary -->
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Sumar / Descriere</label>
              <UiTextarea
                :model-value="svc.summary"
                :rows="3"
                @update:model-value="updateService(svc.slug, { summary: $event })"
              />
            </div>

            <!-- Features -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-slate-500">Funcționalități / Caracteristici</label>
                <button class="text-xs text-primary hover:underline" @click="addFeature(svc.slug)">+ Adaugă</button>
              </div>
              <div class="space-y-2">
                <div v-for="(feat, fi) in svc.features" :key="fi" class="flex items-center gap-2">
                  <UiInput :model-value="feat" @update:model-value="updateFeature(svc.slug, fi, $event)" placeholder="Descriere funcționalitate" />
                  <button class="text-red-400 hover:text-red-600 shrink-0" @click="removeFeature(svc.slug, fi)">
                    <Icon name="fa6-solid:trash-can" class="text-sm" />
                  </button>
                </div>
              </div>
            </div>

            <!-- FAQs -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-slate-500">Întrebări Frecvente</label>
                <button class="text-xs text-primary hover:underline" @click="addFaq(svc.slug)">+ Adaugă FAQ</button>
              </div>
              <div class="space-y-4">
                <div v-for="(faq, fi) in svc.faqs" :key="fi" class="bg-slate-50 dark:bg-dark-hover rounded-lg p-4 space-y-3">
                  <div class="flex items-start gap-3">
                    <div class="flex-1 space-y-3">
                      <div>
                        <label class="block text-xs text-slate-400 mb-1">Întrebare</label>
                        <UiInput :model-value="faq.q" @update:model-value="updateFaq(svc.slug, fi, 'q', $event)" placeholder="Textul întrebării" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-400 mb-1">Răspuns</label>
                        <UiTextarea :model-value="faq.a" :rows="2" @update:model-value="updateFaq(svc.slug, fi, 'a', $event)" placeholder="Răspunsul" />
                      </div>
                    </div>
                    <button class="text-red-400 hover:text-red-600 shrink-0 mt-7" @click="removeFaq(svc.slug, fi)">
                      <Icon name="fa6-solid:trash-can" class="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>