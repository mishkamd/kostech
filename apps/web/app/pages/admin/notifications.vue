<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Notificări — Kostech Admin', robots: 'noindex,nofollow' })

interface SettingsShape {
  telegram: { botToken: string; chatId: string; enabled: boolean; configured: boolean }
  notifications: {
    leadCreated: boolean
    bookingCreated: boolean
    leadStatusChanged: boolean
    bookingStatusChanged: boolean
  }
  lastReadAt: number
  updatedAt: number
}

const settings = ref<SettingsShape | null>(null)
const loading = ref(true)
const saving = ref(false)
const savedMsg = ref('')
const errorMsg = ref('')

const toggles = reactive({
  leadCreated: true,
  bookingCreated: true,
  leadStatusChanged: true,
  bookingStatusChanged: true,
})

const lastReadAt = ref(0)

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<SettingsShape>('/api/admin/settings')
    settings.value = data
    toggles.leadCreated = data.notifications.leadCreated
    toggles.bookingCreated = data.notifications.bookingCreated
    toggles.leadStatusChanged = data.notifications.leadStatusChanged
    toggles.bookingStatusChanged = data.notifications.bookingStatusChanged
    lastReadAt.value = data.lastReadAt
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare la încărcare'
  } finally {
    loading.value = false
  }
}

async function saveToggles() {
  saving.value = true
  savedMsg.value = ''
  errorMsg.value = ''
  try {
    const res = await $fetch<{ ok: boolean; settings: SettingsShape }>('/api/admin/settings', {
      method: 'PUT',
      body: { notifications: { ...toggles } },
    })
    settings.value = res.settings
    savedMsg.value = 'Preferințe salvate.'
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare la salvare'
  } finally {
    saving.value = false
  }
}

async function markAllRead() {
  errorMsg.value = ''
  try {
    const res = await $fetch<{ ok: boolean; lastReadAt: number }>(
      '/api/admin/notifications/mark-read',
      { method: 'POST' },
    )
    lastReadAt.value = res.lastReadAt
    savedMsg.value = 'Toate marcate ca citite.'
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare'
  }
}

const formattedLastRead = computed(() => {
  if (!lastReadAt.value) return 'Niciodată'
  try {
    return new Date(lastReadAt.value).toLocaleString('ro-RO', {
      dateStyle: 'medium', timeStyle: 'short',
    })
  } catch {
    return new Date(lastReadAt.value).toString()
  }
})

const { payload, refresh } = useAdminNotifications()

await load()
</script>

<template>
  <div>
    <BentoCard class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">Notificări admin</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Alege ce evenimente declanșează alerte pe Telegram și pe dashboard.
          </p>
        </div>
      </div>
    </BentoCard>

    <div v-if="loading" class="text-center py-20 text-slate-500">
      <Icon name="fa6-solid:spinner" class="animate-spin text-2xl" />
    </div>

    <template v-else>
      <!-- Toggles card -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Evenimente active</h2>

        <div class="divide-y divide-slate-100 dark:divide-dark-border">
          <label class="flex items-center justify-between gap-4 py-3 cursor-pointer">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="fa6-solid:envelope" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Lead nou (formular contact)</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Cineva trimite mesaj din pagina principală.</p>
              </div>
            </div>
            <input v-model="toggles.leadCreated" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40">
          </label>

          <label class="flex items-center justify-between gap-4 py-3 cursor-pointer">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Icon name="fa6-solid:calendar-check" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Programare nouă (/booking)</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Cineva programează o vizită din wizard.</p>
              </div>
            </div>
            <input v-model="toggles.bookingCreated" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40">
          </label>

          <label class="flex items-center justify-between gap-4 py-3 cursor-pointer">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-9 h-9 rounded-full bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Icon name="fa6-solid:envelope-open-text" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Lead — schimbare status</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Când muți un lead la in_progress / done / canceled.</p>
              </div>
            </div>
            <input v-model="toggles.leadStatusChanged" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40">
          </label>

          <label class="flex items-center justify-between gap-4 py-3 cursor-pointer">
            <div class="flex items-start gap-3 min-w-0">
              <span class="w-9 h-9 rounded-full bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Icon name="fa6-solid:calendar-day" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Programare — schimbare status</p>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Când o programare e finalizată sau anulată.</p>
              </div>
            </div>
            <input v-model="toggles.bookingStatusChanged" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40">
          </label>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            type="button"
            class="text-xs px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            :disabled="saving"
            @click="saveToggles"
          >
            <Icon name="fa6-solid:floppy-disk" class="mr-1" />
            {{ saving ? 'Se salvează…' : 'Salvează preferințe' }}
          </button>
          <span v-if="savedMsg" class="text-xs text-green-600"><Icon name="fa6-solid:check" /> {{ savedMsg }}</span>
          <span v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</span>
        </div>
      </BentoCard>

      <!-- Status card -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Stare</h2>

        <div class="grid sm:grid-cols-2 gap-4">
          <div class="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50">
            <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Ultima citire</p>
            <p class="text-base font-bold text-slate-900 dark:text-white mt-1">{{ formattedLastRead }}</p>
          </div>
          <div class="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/50">
            <p class="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Necitite acum</p>
            <p class="text-base font-bold text-slate-900 dark:text-white mt-1">
              {{ payload?.count ?? 0 }}
              <span v-if="(payload?.count ?? 0) > 0" class="text-red-500 text-xs font-normal">• {{ payload?.count }} nou{{ (payload?.count ?? 0) === 1 ? '' : 'i' }}</span>
            </p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover transition"
            @click="markAllRead"
          >
            <Icon name="fa6-solid:check-double" class="mr-1" /> Marchează toate ca citite
          </button>
          <button
            type="button"
            class="text-xs px-4 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover transition"
            @click="refresh"
          >
            <Icon name="fa6-solid:rotate" class="mr-1" /> Reîmprospătează
          </button>
          <NuxtLink
            to="/admin/telegram"
            class="text-xs px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/15 transition"
          >
            <Icon name="fa6-brands:telegram" class="mr-1" /> Configurează Telegram
          </NuxtLink>
        </div>
      </BentoCard>
    </template>
  </div>
</template>
