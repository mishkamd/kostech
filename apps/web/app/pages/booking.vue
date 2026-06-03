<script setup lang="ts">
import { services } from '~/content/services'

useSeoMeta({
  title: 'Programare — Kostech',
  description: 'Programează o intervenție IT în 4 pași simpli. Diagnoză gratuită.',
  ogImage: '/og/booking.png',
  twitterCard: 'summary_large_image',
  twitterImage: '/og/booking.png',
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

// ── Attachments ──────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_FILES = 3

const attachments = ref<File[]>([])
const imageInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const attachmentError = ref('')

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
      attachmentError.value = `Maxim ${MAX_FILES} fișiere permise.`
      return
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      attachmentError.value = `Tip nepermis: ${f.name}. Sunt permise imagini și PDF.`
      return
    }
    if (f.size > MAX_SIZE) {
      attachmentError.value = `Fișierul ${f.name} depășește 5 MB.`
      return
    }
    attachments.value = [...attachments.value, f]
  }
  attachmentError.value = ''
}

function removeAttachment(idx: number) {
  attachments.value = attachments.value.filter((_, i) => i !== idx)
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const dates = computed(() => {
  const today = new Date()
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      month: d.toLocaleDateString('ro-RO', { month: 'short' }).toUpperCase().replace('.', ''),
      weekday: d.toLocaleDateString('ro-RO', { weekday: 'short' }),
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

const submit = async () => {
  submitting.value = true
  errorMsg.value = ''
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

    await $fetch('/api/bookings', { method: 'POST', body: { ...data, attachments: attachmentPayload } })
    done.value = true
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'A apărut o eroare.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <BentoCard v-if="done" class="text-center !mb-6">
    <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
      <Icon name="fa6-solid:check" class="text-3xl" />
    </div>
    <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Programare confirmată!</h2>
    <p class="text-slate-500 dark:text-slate-400 mt-2">Te contactăm telefonic pentru confirmare în maxim 1 oră.</p>
    <UiButton to="/" class="mt-6">Înapoi acasă</UiButton>
  </BentoCard>

  <BentoCard v-else>
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {{ step === 1 ? 'Alege serviciul' : step === 2 ? 'Alege data' : step === 3 ? 'Datele tale' : 'Confirmă programarea' }}
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ step === 1 ? 'De ce ai nevoie astăzi?' : step === 2 ? 'Următoarele 14 zile.' : step === 3 ? 'Cum te contactăm?' : 'Verifică datele înainte de trimitere.' }}
        </p>
      </div>
      <div class="flex items-center justify-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:justify-end">
        <span v-for="n in 4" :key="n" class="flex items-center gap-3">
          <span
            class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition"
            :class="step >= n ? 'bg-primary text-white shadow-primary' : 'bg-slate-100 dark:bg-dark-bg text-slate-400'"
          >{{ n }}</span>
          <span v-if="n < 4" class="w-10 h-px bg-slate-200 dark:bg-dark-border" />
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
        <UiInput v-model="data.name" label="Nume complet" id="b-name" required />
      </div>
      <div>
        <UiInput v-model="data.phone" type="tel" label="Telefon" id="b-phone" required />
      </div>
      <div>
        <UiInput v-model="data.email" type="email" label="Email (opțional)" id="b-email" />
      </div>
      <div>
        <UiInput v-model="data.address" label="Adresă (opțional)" id="b-addr" />
      </div>
      <div class="sm:col-span-2">
        <label for="b-notes" class="block text-sm font-semibold mb-1 dark:text-slate-300">Detalii suplimentare</label>
        <div class="relative">
          <textarea
            id="b-notes"
            v-model="data.notes"
            rows="3"
            class="w-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-xl px-4 py-3 pr-24 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition-colors"
          />
          <div class="absolute bottom-3 right-3 flex items-center gap-2">
            <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple class="hidden" @change="handleFileInput" />
            <input ref="fileInputRef" type="file" accept="application/pdf" multiple class="hidden" @change="handleFileInput" />
            <button type="button" aria-label="Atașează poză" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 flex items-center justify-center transition" :class="attachments.length >= MAX_FILES ? 'opacity-40 cursor-not-allowed' : ''" :disabled="attachments.length >= MAX_FILES" @click="pickImages">
              <Icon name="fa6-regular:image" />
            </button>
            <button type="button" aria-label="Atașează fișier PDF" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:text-primary hover:border-primary/40 flex items-center justify-center transition" :class="attachments.length >= MAX_FILES ? 'opacity-40 cursor-not-allowed' : ''" :disabled="attachments.length >= MAX_FILES" @click="pickFiles">
              <Icon name="fa6-solid:paperclip" />
            </button>
          </div>
        </div>
        <div v-if="attachmentError" class="mt-1 text-xs text-red-500">{{ attachmentError }}</div>
        <div v-if="attachments.length" class="mt-2 flex flex-wrap gap-2">
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
      </div>
    </div>

    <!-- Step 4: confirm -->
    <div v-else>
      <dl class="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">Serviciu</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ services.find((s) => s.slug === data.serviceSlug)?.title }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">Dată</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.date }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">Nume</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.name }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500 dark:text-slate-400">Telefon</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.phone }}</dd>
        </div>
        <div v-if="data.email">
          <dt class="text-xs text-slate-500 dark:text-slate-400">Email</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.email }}</dd>
        </div>
        <div v-if="data.address">
          <dt class="text-xs text-slate-500 dark:text-slate-400">Adresă</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ data.address }}</dd>
        </div>
        <div v-if="attachments.length">
          <dt class="text-xs text-slate-500 dark:text-slate-400">Fișiere atașate</dt>
          <dd class="font-semibold text-slate-900 dark:text-white">{{ attachments.length }} {{ attachments.length === 1 ? 'fișier' : 'fișiere' }}</dd>
        </div>
      </dl>
      <p v-if="errorMsg" class="text-xs text-red-500 mt-4">{{ errorMsg }}</p>
    </div>

    <div class="flex justify-between gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-dark-border">
      <UiButton v-if="step > 1" variant="outline" @click="back">
        <Icon name="fa6-solid:arrow-left" /> Înapoi
      </UiButton>
      <span v-else />
      <UiButton v-if="step < 4" :disabled="!canNext" @click="next">
        Continuă <Icon name="fa6-solid:arrow-right" />
      </UiButton>
      <UiButton v-else :disabled="submitting" @click="submit">
        {{ submitting ? 'Se trimite…' : 'Confirmă programarea' }}
      </UiButton>
    </div>
  </BentoCard>
</template>
