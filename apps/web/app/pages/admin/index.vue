<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Dashboard — Kostech Admin', robots: 'noindex,nofollow' })

// ── Stats ────────────────────────────────────────────────────────────────────
const { data: stats, refresh } = await useFetch('/api/admin/stats', {
  default: () => ({
    leads: 0, bookings: 0, newToday: 0,
    leadsByStatus: { new: 0, in_progress: 0, done: 0, canceled: 0 },
    bookingsByStatus: { new: 0, in_progress: 0, done: 0, canceled: 0 },
  }),
})

// ── Recent activity (fetched from /api/admin/leads + /api/admin/bookings) ────
const { data: recentLeads } = await useFetch('/api/admin/leads', {
  default: () => [],
  query: { _limit: 5 },
})
const { data: recentBookings } = await useFetch('/api/admin/bookings', {
  default: () => [],
  query: { _limit: 5 },
})

const activity = computed(() => {
  const items: Array<{ kind: 'lead' | 'booking'; id: string; name: string; detail: string; status: string; createdAt: number; icon: string; color: string }> = []
  for (const l of recentLeads.value.slice(0, 5)) {
    items.push({
      kind: 'lead', id: l.id, name: l.name || '—', detail: l.phone || '', status: l.status || 'new', createdAt: l.createdAt,
      icon: 'fa6-solid:envelope-open-text', color: 'text-primary bg-primary/10 dark:bg-primary/20',
    })
  }
  for (const b of recentBookings.value.slice(0, 5)) {
    items.push({
      kind: 'booking', id: b.id, name: b.name || '—', detail: b.serviceSlug || b.date || '', status: b.status || 'new', createdAt: b.createdAt,
      icon: 'fa6-solid:calendar-check', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20',
    })
  }
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  return items.slice(0, 8)
})

const statusLabel: Record<string, { label: string; dot: string; bg: string }> = {
  new: { label: 'Nou', dot: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'În lucru', dot: 'bg-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  done: { label: 'Finalizat', dot: 'bg-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  canceled: { label: 'Anulat', dot: 'bg-red-400', bg: 'bg-red-100 dark:bg-red-900/20' },
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'acum câteva secunde'
  if (diff < 3_600_000) return `acum ${Math.round(diff / 60_000)} min`
  if (diff < 86_400_000) return `acum ${Math.round(diff / 3_600_000)}h`
  return new Date(ts).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}

function statusPercent(count: number, total: number) {
  if (!total) return 0
  return Math.round((count / total) * 100)
}

// ── KPI definitions ─────────────────────────────────────────────────────────
const kpis = computed(() => [
  {
    label: 'Total comenzi', value: stats.value.leads, icon: 'fa6-solid:envelope-open-text',
    gradient: 'from-primary/20 to-primary/5', iconBg: 'bg-primary/10 dark:bg-primary/20', iconColor: 'text-primary',
    href: '/admin/leads',
  },
  {
    label: 'Programări', value: stats.value.bookings, icon: 'fa6-solid:calendar-check',
    gradient: 'from-amber-500/20 to-amber-500/5', iconBg: 'bg-amber-500/10 dark:bg-amber-500/20', iconColor: 'text-amber-600 dark:text-amber-400',
    href: '/admin/leads?tab=bookings',
  },
  {
    label: 'Activitate azi', value: stats.value.newToday, icon: 'fa6-solid:bolt',
    gradient: 'from-emerald-500/20 to-emerald-500/5', iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400',
    href: '/admin/leads',
  },
  {
    label: 'Total operațiuni', value: stats.value.leads + stats.value.bookings, icon: 'fa6-solid:chart-line',
    gradient: 'from-violet-500/20 to-violet-500/5', iconBg: 'bg-violet-500/10 dark:bg-violet-500/20', iconColor: 'text-violet-600 dark:text-violet-400',
    href: '/admin',
  },
])

const statusKeys = ['new', 'in_progress', 'done', 'canceled'] as const
</script>

<template>
  <div class="space-y-6">
    <!-- ── Page Header ────────────────────────────────────── -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Vizualizare generală a activității Kostech</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition"
        @click="refresh()"
      >
        <Icon name="fa6-solid:rotate" class="text-[11px]" />
        Reîmprospătează
      </button>
    </div>

    <!-- ── KPI Cards ──────────────────────────────────────── -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="kpi in kpis"
        :key="kpi.label"
        :to="kpi.href"
        class="relative overflow-hidden bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
      >
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-br opacity-50 dark:opacity-30" :class="kpi.gradient" />
        <div class="relative z-10">
          <div class="flex items-center justify-between mb-3">
            <div :class="['w-10 h-10 rounded-xl flex items-center justify-center', kpi.iconBg]">
              <Icon :name="kpi.icon" :class="['text-base', kpi.iconColor]" />
            </div>
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-slate-300 dark:text-slate-600 group-hover:text-primary transition text-[11px]" />
          </div>
          <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ kpi.value }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ kpi.label }}</p>
        </div>
      </NuxtLink>
    </div>

    <!-- ── Status Pipelines + Recent Activity ────────────── -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Leads Pipeline -->
      <div class="lg:col-span-1 bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Stare comenzi</h2>
          <NuxtLink to="/admin/leads" class="text-[10px] font-semibold text-primary hover:underline">Vezi toate</NuxtLink>
        </div>
        <div class="space-y-4">
          <div v-for="key in statusKeys" :key="'l-'+key" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span :class="['w-2 h-2 rounded-full', statusLabel[key].dot]" />
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ statusLabel[key].label }}</span>
              </div>
              <span class="font-bold text-slate-900 dark:text-white">
                {{ (stats.leadsByStatus as any)[key] }}
                <span class="text-slate-400 dark:text-slate-500 font-normal">{{ statusPercent((stats.leadsByStatus as any)[key], stats.leads) }}%</span>
              </span>
            </div>
            <div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="key === 'new' ? 'bg-slate-400' : key === 'in_progress' ? 'bg-amber-400' : key === 'done' ? 'bg-emerald-400' : 'bg-red-400'"
                :style="{ width: statusPercent((stats.leadsByStatus as any)[key], stats.leads) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Bookings Pipeline -->
      <div class="lg:col-span-1 bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Stare programări</h2>
          <NuxtLink to="/admin/leads?tab=bookings" class="text-[10px] font-semibold text-primary hover:underline">Vezi toate</NuxtLink>
        </div>
        <div class="space-y-4">
          <div v-for="key in statusKeys" :key="'b-'+key" class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span :class="['w-2 h-2 rounded-full', statusLabel[key].dot]" />
                <span class="font-medium text-slate-700 dark:text-slate-300">{{ statusLabel[key].label }}</span>
              </div>
              <span class="font-bold text-slate-900 dark:text-white">
                {{ (stats.bookingsByStatus as any)[key] }}
                <span class="text-slate-400 dark:text-slate-500 font-normal">{{ statusPercent((stats.bookingsByStatus as any)[key], stats.bookings) }}%</span>
              </span>
            </div>
            <div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="key === 'new' ? 'bg-slate-400' : key === 'in_progress' ? 'bg-amber-400' : key === 'done' ? 'bg-emerald-400' : 'bg-red-400'"
                :style="{ width: statusPercent((stats.bookingsByStatus as any)[key], stats.bookings) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Feed -->
      <div class="lg:col-span-1 bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Activitate recentă</h2>
          <NuxtLink to="/admin/leads" class="text-[10px] font-semibold text-primary hover:underline">Arhivă</NuxtLink>
        </div>
        <div class="space-y-1">
          <div v-for="item in activity" :key="item.kind + item.id" class="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-hover transition group">
            <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.color]">
              <Icon :name="item.icon" class="text-xs" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{{ item.name }}</p>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{{ timeAgo(item.createdAt) }}</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{{ item.detail || '—' }}</p>
            </div>
            <NuxtLink
              :to="item.kind === 'lead' ? `/admin/leads?focus=${item.id}` : `/admin/leads?tab=bookings&focus=${item.id}`"
              class="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-primary transition"
            >
              <Icon name="fa6-solid:chevron-right" class="text-[10px]" />
            </NuxtLink>
          </div>
          <div v-if="!activity.length" class="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            <Icon name="fa6-solid:inbox" class="text-xl text-slate-300 dark:text-slate-600 mb-2" />
            <p>Nicio activitate recentă</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Quick Actions ─────────────────────────────────── -->
    <div class="bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-5">
      <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Acțiuni rapide</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NuxtLink
          to="/admin/leads"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center">
            <Icon name="fa6-solid:envelope-open-text" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Comenzi</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Gestionează cererile</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/content"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Icon name="fa6-solid:pen-to-square" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Conținut</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Editează pagina</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/telegram"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Icon name="fa6-brands:telegram" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Telegram</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Notificări bot</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/notifications"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Icon name="fa6-solid:bell" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificări</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Preferințe alerte</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/services"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Icon name="fa6-solid:list" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Servicii</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Cataloage servicii</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/admin/users"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Icon name="fa6-solid:users" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Utilizatori</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Administrare conturi</p>
          </div>
        </NuxtLink>

        <NuxtLink
          to="/"
          target="_blank"
          class="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-dark-border hover:border-primary/30 dark:hover:border-primary/30 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.04] transition group"
        >
          <div class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Icon name="fa6-solid:arrow-up-right-from-square" class="text-sm" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Site public</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Vezi site-ul live</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
