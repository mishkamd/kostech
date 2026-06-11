<script setup lang="ts">
import { services } from '~/content/services'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Cereri — Admin', robots: 'noindex,nofollow' })

const serviceMap = Object.fromEntries(services.map(s => [s.slug, { title: s.title, icon: s.icon }]))
function serviceInfo(slug: string) {
  return serviceMap[slug] ?? { title: slug, icon: 'fa6-solid:wrench' }
}

const route = useRoute()
const tab = ref<'leads' | 'bookings'>('leads')
const focusId = ref<string>('')

// React to query params: ?tab=leads|bookings and ?focus=<id>
watch(
  () => [route.query.tab, route.query.focus],
  ([t, f]) => {
    if (t === 'leads' || t === 'bookings') tab.value = t
    if (typeof f === 'string') focusId.value = f
  },
  { immediate: true },
)

// Scroll the focused row into view once the table has rendered.
watch(focusId, async (id) => {
  if (!id) return
  await nextTick()
  const el = document.querySelector(`[data-row-id="${id}"]`)
  if (el && 'scrollIntoView' in el) {
    (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  setTimeout(() => (focusId.value = ''), 4000)
})

const { data: leads, refresh: refreshLeads } = await useFetch('/api/admin/leads', { default: () => [] as any[] })
const { data: bookings, refresh: refreshBookings } = await useFetch('/api/admin/bookings', { default: () => [] as any[] })

const updateLeadStatus = async (id: string, status: string) => {
  await $fetch(`/api/admin/leads/${id}`, { method: 'PATCH', body: { status } })
  await refreshLeads()
}
const updateBookingStatus = async (id: string, status: string) => {
  await $fetch(`/api/admin/bookings/${id}`, { method: 'PATCH', body: { status } })
  await refreshBookings()
}

// ── Preview modal ────────────────────────────────────────────
const preview = ref<{ url: string; name: string; type: string } | null>(null)

function openPreview(url: string, name: string, type: string) {
  preview.value = { url, name, type }
}
function closePreview() {
  preview.value = null
}

if (import.meta.client) {
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') closePreview()
  })
}

// ── Edit modal ──────────────────────────────────────────────
const editTarget = ref<any>(null)
const editForm = reactive({ name: '', phone: '', message: '', location: '', scheduledAt: '', status: 'new' })
const editSaving = ref(false)

function openEdit(lead: any) {
  editTarget.value = lead
  editForm.name = lead.name ?? ''
  editForm.phone = lead.phone ?? ''
  editForm.message = lead.message || lead.description || ''
  editForm.location = lead.location ?? ''
  editForm.scheduledAt = lead.scheduledAt ?? ''
  editForm.status = lead.status ?? 'new'
}

async function saveEdit() {
  if (!editTarget.value) return
  editSaving.value = true
  try {
    await $fetch(`/api/admin/leads/${editTarget.value.id}`, { method: 'PATCH', body: { ...editForm } })
    editTarget.value = null
    await refreshLeads()
  } finally {
    editSaving.value = false
  }
}

// ── Delete modal ─────────────────────────────────────────────
const deleteTarget = ref<any>(null)
const deleteLoading = ref(false)

async function doDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await $fetch(`/api/admin/leads/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refreshLeads()
  } finally {
    deleteLoading.value = false
  }
}

// ── Booking Edit modal ────────────────────────────────────
const editBookingTarget = ref<any>(null)
const editBookingForm = reactive({ name: '', phone: '', date: '', address: '', notes: '', status: 'new' })
const editBookingSaving = ref(false)

function openEditBooking(b: any) {
  editBookingTarget.value = b
  editBookingForm.name = b.name ?? ''
  editBookingForm.phone = b.phone ?? ''
  editBookingForm.date = b.date ?? ''
  editBookingForm.address = b.address ?? ''
  editBookingForm.notes = b.notes ?? ''
  editBookingForm.status = b.status ?? 'new'
}

async function saveEditBooking() {
  if (!editBookingTarget.value) return
  editBookingSaving.value = true
  try {
    await $fetch(`/api/admin/bookings/${editBookingTarget.value.id}`, { method: 'PATCH', body: { ...editBookingForm } })
    editBookingTarget.value = null
    await refreshBookings()
  } finally {
    editBookingSaving.value = false
  }
}

// ── Booking Delete modal ──────────────────────────────────
const deleteBookingTarget = ref<any>(null)
const deleteBookingLoading = ref(false)

async function doDeleteBooking() {
  if (!deleteBookingTarget.value) return
  deleteBookingLoading.value = true
  try {
    await $fetch(`/api/admin/bookings/${deleteBookingTarget.value.id}`, { method: 'DELETE' })
    deleteBookingTarget.value = null
    await refreshBookings()
  } finally {
    deleteBookingLoading.value = false
  }
}

// ── Delete All ────────────────────────────────────────────
const deleteAllTarget = ref<'leads' | 'bookings' | null>(null)
const deleteAllLoading = ref(false)

async function doDeleteAll() {
  if (!deleteAllTarget.value) return
  deleteAllLoading.value = true
  try {
    if (deleteAllTarget.value === 'leads') {
      await $fetch('/api/admin/leads', { method: 'DELETE' })
      deleteAllTarget.value = null
      await refreshLeads()
    } else {
      await $fetch('/api/admin/bookings', { method: 'DELETE' })
      deleteAllTarget.value = null
      await refreshBookings()
    }
  } finally {
    deleteAllLoading.value = false
  }
}

// ── Export CSV ────────────────────────────────────────────
function exportCSV(type: 'leads' | 'bookings') {
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const row = (cols: unknown[]) => cols.map(escape).join(',')

  let csv = ''
  if (type === 'leads') {
    csv = [
      row(['Nume', 'Telefon', 'Locație', 'Dată dorită', 'Mesaj', 'Status', 'Creat']),
      ...leads.value.map((l: any) => row([
        l.name, l.phone, l.location, l.scheduledAt,
        l.message || l.description, l.status,
        new Date(l.createdAt).toLocaleString('ro-RO'),
      ])),
    ].join('\n')
  } else {
    csv = [
      row(['Nume', 'Serviciu', 'Data', 'Telefon', 'Adresă', 'Note', 'Status', 'Creat']),
      ...bookings.value.map((b: any) => row([
        b.name, b.serviceSlug, b.date, b.phone,
        b.address, b.notes, b.status,
        new Date(b.createdAt).toLocaleString('ro-RO'),
      ])),
    ].join('\n')
  }

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <BentoCard>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-xl font-bold text-slate-900 dark:text-white">Cereri</h1>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Actions -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-dark-bg hover:bg-slate-200 dark:hover:bg-dark-hover transition"
          @click="exportCSV(tab)"
        >
          <Icon name="fa6-solid:file-csv" class="text-[11px]" />
          Export CSV
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition"
          @click="deleteAllTarget = tab"
        >
          <Icon name="fa6-solid:trash" class="text-[11px]" />
          Șterge tot
        </button>
        <!-- Tabs -->
        <div class="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-bg rounded-xl">
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg text-sm font-semibold transition"
            :class="tab === 'leads' ? 'bg-white dark:bg-dark-card text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="tab = 'leads'"
          >
            Comenzi
            <span v-if="leads.length" class="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{{ leads.length }}</span>
          </button>
          <button
            type="button"
            class="px-4 py-1.5 rounded-lg text-sm font-semibold transition"
            :class="tab === 'bookings' ? 'bg-white dark:bg-dark-card text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'"
            @click="tab = 'bookings'"
          >
            Programări
            <span v-if="bookings.length" class="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{{ bookings.length }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tab: Comenzi -->
    <div v-if="tab === 'leads'" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr class="border-b border-slate-100 dark:border-dark-border">
            <th class="py-3 pr-4">Nume</th>
            <th class="py-3 pr-4">Contact</th>
            <th class="py-3 pr-4">Locație</th>
            <th class="py-3 pr-4">Dată dorită</th>
            <th class="py-3 pr-4">Mesaj</th>
            <th class="py-3 pr-4">Status</th>
            <th class="py-3 pr-4">Creat</th>
            <th class="py-3 pr-4">Fișiere</th>
            <th class="py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in leads" :key="l.id" :data-row-id="l.id" :class="['border-b border-slate-50 dark:border-dark-border transition-colors duration-700', focusId === l.id ? 'bg-amber-50 dark:bg-amber-500/10' : '']">
            <td class="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{{ l.name }}</td>
            <td class="py-3 pr-4 text-slate-600 dark:text-slate-300">{{ l.phone || '—' }}</td>
            <td class="py-3 pr-4 text-slate-500 max-w-[180px] truncate">{{ l.location || '—' }}</td>
            <td class="py-3 pr-4 text-slate-500 text-xs whitespace-nowrap">{{ l.scheduledAt || '—' }}</td>
            <td class="py-3 pr-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{{ l.message || l.description || '—' }}</td>
            <td class="py-3 pr-4">
              <select
                :value="l.status"
                class="bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-lg px-2 py-1 text-xs"
                @change="updateLeadStatus(l.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="new">Nou</option>
                <option value="in_progress">În lucru</option>
                <option value="done">Rezolvat</option>
                <option value="canceled">Anulat</option>
              </select>
            </td>
            <td class="py-3 pr-4 text-xs text-slate-500">{{ new Date(l.createdAt).toLocaleString('ro-RO') }}</td>
            <td class="py-3 pr-4">
              <div v-if="l.attachments?.length" class="flex flex-col gap-1">
                <button
                  v-for="(att, idx) in l.attachments"
                  :key="idx"
                  type="button"
                  class="inline-flex items-center gap-1 text-xs text-primary hover:underline text-left"
                  @click="openPreview(`/api/admin/leads/${l.id}/attachment/${idx}`, att.name, att.type)"
                >
                  <Icon :name="att.type === 'application/pdf' ? 'fa6-solid:file-pdf' : 'fa6-regular:image'" class="shrink-0" />
                  <span class="max-w-[100px] truncate">{{ att.name }}</span>
                </button>
              </div>
              <span v-else class="text-slate-400 text-xs">—</span>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-1">
                <button type="button" aria-label="Editează lead" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition" @click="openEdit(l)">
                  <Icon name="fa6-solid:pen" class="text-xs" />
                </button>
                <button type="button" aria-label="Șterge lead" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" @click="deleteTarget = l">
                  <Icon name="fa6-solid:trash" class="text-xs" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!leads.length">
            <td colspan="8" class="py-8 text-center text-slate-400">Nu există comenzi.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab: Programări -->
    <div v-if="tab === 'bookings'" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
          <tr class="border-b border-slate-100 dark:border-dark-border">
            <th class="py-3 pr-4">Nume</th>
            <th class="py-3 pr-4">Serviciu</th>
            <th class="py-3 pr-4">Data</th>
            <th class="py-3 pr-4">Telefon</th>
            <th class="py-3 pr-4">Adresă</th>
            <th class="py-3 pr-4">Status</th>
            <th class="py-3 pr-4">Fișiere</th>
            <th class="py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.id" :data-row-id="b.id" :class="['border-b border-slate-50 dark:border-dark-border transition-colors duration-700', focusId === b.id ? 'bg-amber-50 dark:bg-amber-500/10' : '']">
            <td class="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{{ b.name }}</td>
            <td class="py-3 pr-4">
              <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Icon :name="serviceInfo(b.serviceSlug).icon" class="text-primary shrink-0" />
                <span>{{ serviceInfo(b.serviceSlug).title }}</span>
              </div>
            </td>
            <td class="py-3 pr-4">{{ b.date }}</td>
            <td class="py-3 pr-4 text-slate-500">{{ b.phone }}</td>
            <td class="py-3 pr-4 text-slate-500 max-w-[200px] truncate">{{ b.address || '—' }}</td>
            <td class="py-3 pr-4">
              <select
                :value="b.status"
                class="bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-lg px-2 py-1 text-xs"
                @change="updateBookingStatus(b.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="new">Nou</option>
                <option value="in_progress">În lucru</option>
                <option value="done">Finalizat</option>
                <option value="canceled">Anulat</option>
              </select>
            </td>
            <td class="py-3 pr-4">
              <div v-if="b.attachments?.length" class="flex flex-col gap-1">
                <button
                  v-for="(att, idx) in b.attachments"
                  :key="idx"
                  type="button"
                  class="inline-flex items-center gap-1 text-xs text-primary hover:underline text-left"
                  @click="openPreview(`/api/admin/bookings/${b.id}/attachment/${idx}`, att.name, att.type)"
                >
                  <Icon :name="att.type === 'application/pdf' ? 'fa6-solid:file-pdf' : 'fa6-regular:image'" class="shrink-0" />
                  <span class="max-w-[100px] truncate">{{ att.name }}</span>
                </button>
              </div>
              <span v-else class="text-slate-400 text-xs">—</span>
            </td>
            <td class="py-3">
              <div class="flex items-center gap-1">
                <button type="button" aria-label="Editează programare" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition" @click="openEditBooking(b)">
                  <Icon name="fa6-solid:pen" class="text-xs" />
                </button>
                <button type="button" aria-label="Șterge programare" class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" @click="deleteBookingTarget = b">
                  <Icon name="fa6-solid:trash" class="text-xs" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!bookings.length">
            <td colspan="8" class="py-8 text-center text-slate-400">Nu există programări.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </BentoCard>

  <!-- ── Preview Modal ─────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="preview" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Previzualizare fișier" @click.self="closePreview">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="closePreview" />
        <div class="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-dark-border shrink-0">
            <div class="flex items-center gap-2 min-w-0">
              <Icon :name="preview.type === 'application/pdf' ? 'fa6-solid:file-pdf' : 'fa6-regular:image'" class="text-slate-400 shrink-0" />
              <span class="text-sm font-semibold text-slate-800 dark:text-white truncate">{{ preview.name }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0 ml-4">
              <a
                :href="preview.url"
                :download="preview.name"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition"
              >
                <Icon name="fa6-solid:download" class="text-[11px]" />
                Descarcă
              </a>
              <button
                type="button"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition"
                @click="closePreview"
              >
                <Icon name="fa6-solid:xmark" />
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-auto flex items-center justify-center bg-slate-50 dark:bg-dark-bg min-h-0">
            <img
              v-if="preview.type.startsWith('image/')"
              :src="preview.url"
              :alt="preview.name"
              class="max-w-full max-h-[75vh] object-contain"
            />
            <iframe
              v-else-if="preview.type === 'application/pdf'"
              :src="preview.url"
              class="w-full h-[75vh] border-0"
              :title="preview.name"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Edit Modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-lead-title" @click.self="editTarget = null">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="editTarget = null" />
        <div class="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 z-10">
          <!-- Header -->
          <div class="flex items-center justify-between mb-5">
            <h2 id="edit-lead-title" class="text-base font-bold text-slate-900 dark:text-white">Editează lead</h2>
            <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="editTarget = null">
              <Icon name="fa6-solid:xmark" />
            </button>
          </div>
          <!-- Form -->
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Nume</label>
              <input v-model="editForm.name" type="text" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
              <input v-model="editForm.phone" type="text" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Dată dorită</label>
              <input v-model="editForm.scheduledAt" type="text" placeholder="ex: 2026-06-12" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Mesaj</label>
              <textarea v-model="editForm.message" rows="3" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Locație</label>
              <input v-model="editForm.location" type="text" placeholder="Adresa / orașul" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select v-model="editForm.status" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="new">Nou</option>
                <option value="in_progress">În lucru</option>
                <option value="done">Rezolvat</option>
                <option value="canceled">Anulat</option>
              </select>
            </div>
          </div>
          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 mt-5">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="editTarget = null">Anulează</button>
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60" :disabled="editSaving" @click="saveEdit">
              {{ editSaving ? 'Se salvează...' : 'Salvează' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ──────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-lead-title">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteTarget = null" />
        <div class="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 z-10 text-center">
          <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="fa6-solid:trash" class="text-red-500 text-lg" />
          </div>
          <h2 id="delete-lead-title" class="text-base font-bold text-slate-900 dark:text-white mb-2">Șterge lead</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ești sigur că vrei să ștergi lead-ul <span class="font-semibold text-slate-700 dark:text-slate-200">{{ deleteTarget.name }}</span>? Acțiunea nu poate fi anulată.
          </p>
          <div class="flex items-center justify-center gap-3">
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="deleteTarget = null">Nu</button>
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-60" :disabled="deleteLoading" @click="doDelete">
              {{ deleteLoading ? 'Se șterge...' : 'Da, șterge' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Edit Booking Modal ──────────────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="editBookingTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-booking-title" @click.self="editBookingTarget = null">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="editBookingTarget = null" />
        <div class="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 z-10">
          <div class="flex items-center justify-between mb-5">
            <h2 id="edit-booking-title" class="text-base font-bold text-slate-900 dark:text-white">Editează programare</h2>
            <button type="button" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="editBookingTarget = null">
              <Icon name="fa6-solid:xmark" />
            </button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Nume</label>
              <input v-model="editBookingForm.name" type="text" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
              <input v-model="editBookingForm.phone" type="text" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Data</label>
              <input v-model="editBookingForm.date" type="date" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Adresă</label>
              <input v-model="editBookingForm.address" type="text" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Note</label>
              <textarea v-model="editBookingForm.notes" rows="3" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select v-model="editBookingForm.status" class="w-full rounded-lg border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="new">Nou</option>
                <option value="in_progress">În lucru</option>
                <option value="done">Finalizat</option>
                <option value="canceled">Anulat</option>
              </select>
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 mt-5">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="editBookingTarget = null">Anulează</button>
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition disabled:opacity-60" :disabled="editBookingSaving" @click="saveEditBooking">
              {{ editBookingSaving ? 'Se salvează...' : 'Salvează' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Booking Confirm Modal ──────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deleteBookingTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-booking-title">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteBookingTarget = null" />
        <div class="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 z-10 text-center">
          <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="fa6-solid:trash" class="text-red-500 text-lg" />
          </div>
          <h2 id="delete-booking-title" class="text-base font-bold text-slate-900 dark:text-white mb-2">Șterge programare</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Ești sigur că vrei să ștergi programarea pentru <span class="font-semibold text-slate-700 dark:text-slate-200">{{ deleteBookingTarget.name }}</span>? Acțiunea nu poate fi anulată.
          </p>
          <div class="flex items-center justify-center gap-3">
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="deleteBookingTarget = null">Nu</button>
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-60" :disabled="deleteBookingLoading" @click="doDeleteBooking">
              {{ deleteBookingLoading ? 'Se șterge...' : 'Da, șterge' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete All Confirm Modal ───────────────────────── -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="deleteAllTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-all-title">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deleteAllTarget = null" />
        <div class="relative w-full max-w-sm bg-white dark:bg-dark-card rounded-2xl shadow-2xl p-6 z-10 text-center">
          <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="fa6-solid:triangle-exclamation" class="text-red-500 text-lg" />
          </div>
          <h2 id="delete-all-title" class="text-base font-bold text-slate-900 dark:text-white mb-2">
            Șterge toate {{ deleteAllTarget === 'leads' ? 'comenzile' : 'programările' }}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Vor fi șterse
            <span class="font-semibold text-slate-700 dark:text-slate-200">
              {{ deleteAllTarget === 'leads' ? leads.length : bookings.length }}
            </span>
            {{ deleteAllTarget === 'leads' ? 'comenzi' : 'programări' }}. Acțiunea este ireversibilă.
          </p>
          <div class="flex items-center justify-center gap-3">
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover transition" @click="deleteAllTarget = null">Anulează</button>
            <button type="button" class="px-5 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-60" :disabled="deleteAllLoading" @click="doDeleteAll">
              {{ deleteAllLoading ? 'Se șterge...' : 'Da, șterge tot' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}
.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
