<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useSeoMeta({ title: 'Admin — Kostech', robots: 'noindex,nofollow' })

const { data: stats, refresh } = await useFetch('/api/admin/stats', {
  default: () => ({
    leads: 0,
    bookings: 0,
    newToday: 0,
    leadsByStatus: { new: 0, in_progress: 0, done: 0, canceled: 0 },
    bookingsByStatus: { new: 0, in_progress: 0, done: 0, canceled: 0 },
  }),
})

const statusSteps = [
  { key: 'new', label: 'Nou', color: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
  { key: 'in_progress', label: 'În lucru', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400' },
  { key: 'done', label: 'Finalizat', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-400' },
  { key: 'canceled', label: 'Anulat', color: 'text-red-500 dark:text-red-400', dot: 'bg-red-400' },
]
</script>

<template>
  <div class="grid gap-6 md:grid-cols-3">
    <BentoCard>
      <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Comenzi</p>
      <div class="text-4xl font-bold text-slate-900 dark:text-white">{{ stats.leads }}</div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Total cereri</p>
    </BentoCard>
    <BentoCard>
      <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Programări</p>
      <div class="text-4xl font-bold text-slate-900 dark:text-white">{{ stats.bookings }}</div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">În așteptare + active</p>
    </BentoCard>
    <BentoCard>
      <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Astăzi</p>
      <div class="text-4xl font-bold text-slate-900 dark:text-white">{{ stats.newToday }}</div>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Cereri noi în ultimele 24h</p>
    </BentoCard>
  </div>

  <!-- Status pipeline: Comenzi -->
  <BentoCard class="mt-6">
    <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Statut comenzi</p>
    <div class="flex items-center">
      <template v-for="(step, i) in statusSteps" :key="step.key">
        <div class="flex flex-col items-center flex-1 min-w-0">
          <div :class="['w-2.5 h-2.5 rounded-full mb-2 shrink-0', step.dot]" />
          <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ (stats.leadsByStatus as any)[step.key] }}</div>
          <div :class="['text-[11px] font-semibold mt-1 uppercase tracking-wide', step.color]">{{ step.label }}</div>
        </div>
        <div v-if="i < statusSteps.length - 1" class="h-px w-8 bg-slate-200 dark:bg-dark-border shrink-0 mx-1" />
      </template>
    </div>
  </BentoCard>

  <!-- Status pipeline: Programări -->
  <BentoCard class="mt-6">
    <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-5">Statut programări</p>
    <div class="flex items-center">
      <template v-for="(step, i) in statusSteps" :key="step.key">
        <div class="flex flex-col items-center flex-1 min-w-0">
          <div :class="['w-2.5 h-2.5 rounded-full mb-2 shrink-0', step.dot]" />
          <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ (stats.bookingsByStatus as any)[step.key] }}</div>
          <div :class="['text-[11px] font-semibold mt-1 uppercase tracking-wide', step.color]">{{ step.label }}</div>
        </div>
        <div v-if="i < statusSteps.length - 1" class="h-px w-8 bg-slate-200 dark:bg-dark-border shrink-0 mx-1" />
      </template>
    </div>
  </BentoCard>

  <BentoCard class="mt-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Acțiuni rapide</h2>
      <button type="button" class="text-xs text-primary hover:underline" @click="refresh()">Reîmprospătează</button>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <UiButton to="/admin/content" variant="outline" block>
        <Icon name="fa6-solid:pen-to-square" /> Editor pagina principală
      </UiButton>
      <UiButton to="/admin/leads" variant="outline" block>
        <Icon name="fa6-solid:envelope-open-text" /> Vezi comenzi
      </UiButton>
      <UiButton to="/admin/leads?tab=bookings" variant="outline" block>
        <Icon name="fa6-solid:calendar-check" /> Vezi programări
      </UiButton>
      <UiButton to="/admin/telegram" variant="outline" block>
        <Icon name="fa6-brands:telegram" /> Setări Telegram
      </UiButton>
      <UiButton to="/admin/notifications" variant="outline" block>
        <Icon name="fa6-solid:bell" /> Notificări
      </UiButton>
    </div>
  </BentoCard>
</template>
