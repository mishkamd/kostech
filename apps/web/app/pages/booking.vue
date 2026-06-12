<script setup lang="ts">
const { locale, t } = useI18n()
const localePath = useLocalePath()

const { data: services } = await useFetch('/api/content/services', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
  default: () => [],
})

const bookingMeta = computed(() => {
  const map = {
    ro: { title: 'Programare — Kostech', description: 'Programează o intervenție IT în 4 pași simpli. Diagnoză gratuită.' },
    ru: { title: 'Запись — Kostech', description: 'Запишитесь на IT-обслуживание за 4 простых шага. Бесплатная диагностика.' },
    en: { title: 'Book — Kostech', description: 'Book an IT service in 4 simple steps. Free diagnosis.' },
  }
  return map[locale.value as 'ro' | 'ru' | 'en'] ?? map.ro
})

useSeoMeta({
  title: computed(() => bookingMeta.value.title),
  description: computed(() => bookingMeta.value.description),
  ogTitle: computed(() => bookingMeta.value.title),
  ogDescription: computed(() => bookingMeta.value.description),
  ogImage: 'https://kostech.md/og/booking.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://kostech.md/og/booking.png',
})

const step = ref(1)
const data = reactive({
  serviceSlug: '',
  date: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})
const submitting = ref(false)
const done = ref(false)
const errorMsg = ref('')

const {
  attachments, error: attachmentError,
  handleFileInput,
  removeAttachment, buildAttachmentPayload,
  previewUrls, isMaxed, MAX_FILES,
} = useAttachments()

const dateLocale = computed(() => {
  if (locale.value === 'ru') return 'ru-RU'
  if (locale.value === 'en') return 'en-US'
  return 'ro-RO'
})

const dates = computed(() => {
  const today = new Date()
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      month: d.toLocaleDateString(dateLocale.value, { month: 'short' }).toUpperCase().replace('.', ''),
      weekday: d.toLocaleDateString(dateLocale.value, { weekday: 'short' }),
    }
  })
})

const canNext = computed(() => {
  if (step.value === 1) return !!data.serviceSlug
  if (step.value === 2) return !!data.date
  if (step.value === 3) return !!data.name && !!data.phone
  return true
})

const next = () => { if (canNext.value && step.value < 4) step.value++ }
const back = () => { if (step.value > 1) step.value-- }

async function submit() {
  submitting.value = true
  errorMsg.value = ''
  try {
    const attachmentPayload = await buildAttachmentPayload()

    await $fetch('/api/bookings', { method: 'POST', body: { ...data, attachments: attachmentPayload, locale: locale.value } })
    done.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    errorMsg.value = err.data?.message || t('booking.errors.generic')
  } finally {
    submitting.value = false
  }
}

const stepHeading = computed(() => t(`booking.step${step.value}.title`))
const stepSubtitle = computed(() => t(`booking.step${step.value}.subtitle`))

const fileWord = computed(() => {
  const n = attachments.value.length
  return t('booking.file', { count: n }) as unknown as string
})
</script>

<template>
  <BentoCard v-if="done" class="text-center !mb-6">
    <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
      <Icon name="fa6-solid:check" class="text-3xl" />
    </div>
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ t('booking.success.title') }}</h2>
    <p class="text-slate-500 dark:text-slate-400 mt-2">{{ t('booking.success.text') }}</p>
    <UiButton :to="localePath('/')" class="mt-6">{{ t('booking.success.back') }}</UiButton>
  </BentoCard>

  <BentoCard v-else>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1">{{ stepHeading }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">{{ stepSubtitle }}</p>
      </div>
      <div class="flex items-center justify-start sm:justify-end gap-1.5 sm:gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400" role="progressbar" :aria-valuenow="step" aria-valuemin="1" aria-valuemax="4" aria-label="Progres programare">
        <span v-for="n in 4" :key="n" class="flex items-center gap-1.5 sm:gap-3">
          <span
            class="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition"
            :class="step >= n ? 'bg-primary text-white shadow-primary' : 'bg-slate-100 dark:bg-dark-bg text-slate-400'"
          >{{ n }}</span>
          <span v-if="n < 4" class="w-5 sm:w-10 h-px bg-slate-200 dark:bg-dark-border" />
        </span>
      </div>
    </div>

    <!-- Step 1: service -->
    <div v-if="step === 1">
      <div class="grid sm:grid-cols-2 gap-3">
        <button
          v-for="s in services"
          :key="s.slug"
          type="button"
          class="flex items-start gap-3 p-4 rounded-2xl border text-left transition"
          :class="
            data.serviceSlug === s.slug
              ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10'
              : 'border-slate-100 dark:border-dark-border hover:border-primary/50'
          "
          @click="data.serviceSlug = s.slug"
        >
          <div class="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon :name="s.icon" />
          </div>
          <div class="min-w-0">
            <div class="font-bold text-sm text-slate-900 dark:text-white">{{ s.title }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ s.short }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Step 2: date -->
    <div v-else-if="step === 2">
      <div class="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2">
        <button
          v-for="d in dates"
          :key="d.iso"
          type="button"
          class="flex flex-col items-center justify-center p-3 rounded-xl border transition"
          :class="
            data.date === d.iso
              ? 'border-2 border-primary bg-primary/5 dark:bg-primary/10 text-primary'
              : 'border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 hover:border-primary/50'
          "
          @click="data.date = d.iso"
        >
          <span class="text-[10px] uppercase">{{ d.weekday }}</span>
          <span class="text-lg font-bold">{{ d.day }}</span>
          <span class="text-[10px] uppercase">{{ d.month }}</span>
        </button>
      </div>
    </div>

    <!-- Step 3: contact -->
    <div v-else-if="step === 3" class="grid gap-3 sm:grid-cols-2">
      <div>
        <UiInput v-model="data.name" :label="t('booking.fields.name')" id="b-name" required />
      </div>
      <div>
        <UiInput v-model="data.phone" type="tel" :label="t('booking.fields.phone')" id="b-phone" required />
      </div>
      <div>
        <UiInput v-model="data.email" type="email" :label="t('booking.fields.email')" id="b-email" />
      </div>
      <div>
        <UiInput v-model="data.address" :label="t('booking.fields.address')" id="b-addr" />
      </div>
      <div class="sm:col-span-2">
        <label for="b-notes" class="block text-sm font-semibold mb-1 dark:text-slate-300">{{ t('booking.fields.notes') }}</label>
        <div class="relative">
          <textarea
            id="b-notes"
            v-model="data.notes"
            rows="3"
            class="w-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-xl px-4 py-3 pr-24 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-colors"
          />
          <div class="absolute bottom-3 right-3 flex items-center gap-2">
            <label
              :aria-label="t('booking.attach.image')"
              class="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 flex items-center justify-center transition cursor-pointer"
              :class="isMaxed ? 'opacity-40 pointer-events-none' : ''"
            >
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" :disabled="isMaxed" @change="handleFileInput" />
              <Icon name="fa6-regular:image" />
            </label>
            <label
              :aria-label="t('booking.attach.pdf')"
              class="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 flex items-center justify-center transition cursor-pointer"
              :class="isMaxed ? 'opacity-40 pointer-events-none' : ''"
            >
              <input type="file" accept="application/pdf" multiple class="hidden" :disabled="isMaxed" @change="handleFileInput" />
              <Icon name="fa6-solid:paperclip" />
            </label>
          </div>
        </div>
        <div v-if="attachmentError" class="mt-1 text-xs text-red-500">{{ attachmentError }}</div>
        <div v-if="attachments.length" class="mt-2 flex flex-wrap gap-2">
          <div
            v-for="(f, idx) in attachments"
            :key="idx"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-dark-bg border border-slate-200 dark:border-dark-border text-xs text-slate-600 dark:text-slate-300 overflow-hidden"
          >
            <img
              v-if="previewUrls.get(f)"
              :src="previewUrls.get(f)"
              :alt="f.name"
              class="w-8 h-8 rounded object-cover shrink-0"
            />
            <Icon v-else name="fa6-solid:file-pdf" class="text-red-400 shrink-0" />
            <span class="max-w-[100px] truncate">{{ f.name }}</span>
            <button type="button" class="ml-0.5 text-slate-400 hover:text-red-500 transition" @click="removeAttachment(idx)">
              <Icon name="fa6-solid:xmark" class="text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 4: confirm -->
    <div v-else>
      <dl class="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.service') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ services.find((s) => s.slug === data.serviceSlug)?.title }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.date') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.date }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.name') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.name }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.phone') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.phone }}</dd>
        </div>
        <div v-if="data.email">
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.email') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.email }}</dd>
        </div>
        <div v-if="data.address">
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.address') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.address }}</dd>
        </div>
        <div v-if="attachments.length">
          <dt class="text-xs text-slate-500 dark:text-slate-400">{{ t('booking.fields.attachments') }}</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ attachments.length }} {{ fileWord }}</dd>
        </div>
      </dl>
      <p v-if="errorMsg" class="text-xs text-red-500 mt-4">{{ errorMsg }}</p>
    </div>

    <div class="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-dark-border">
      <UiButton v-if="step > 1" variant="outline" @click="back">
        <Icon name="fa6-solid:arrow-left" /> {{ t('booking.back') }}
      </UiButton>
      <span v-else />
      <UiButton v-if="step < 4" :disabled="!canNext" @click="next">
        {{ t('booking.next') }} <Icon name="fa6-solid:arrow-right" />
      </UiButton>
      <UiButton v-else :disabled="submitting" @click="submit">
        {{ submitting ? t('booking.submitting') : t('booking.submit') }}
      </UiButton>
    </div>
  </BentoCard>
</template>
