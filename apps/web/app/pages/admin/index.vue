<script setup lang="ts">
definePageMeta({ layout: 'admin' })

useSeoMeta({ title: 'Admin — Kostech', robots: 'noindex,nofollow' })

const { data: stats, refresh } = await useFetch('/api/admin/stats', { default: () => ({ leads: 0, bookings: 0, newToday: 0 }) })
</script>

<template>
  <div class="grid gap-6 md:grid-cols-3">
    <BentoCard>
      <p class="text-[11px] font-bold text-primary uppercase tracking-wider mb-2">Lead-uri</p>
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
        <Icon name="fa6-solid:envelope-open-text" /> Vezi lead-uri
      </UiButton>
      <UiButton to="/admin/bookings" variant="outline" block>
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
