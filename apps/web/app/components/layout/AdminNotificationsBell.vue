<script setup lang="ts">
const { payload, markRead, refresh } = useAdminNotifications()

const open = ref(false)
const router = useRouter()

const unread = computed(() => payload.value?.count ?? 0)
const items = computed(() => {
  const leads = (payload.value?.latest.leads ?? []).map((l) => ({ kind: 'lead' as const, item: l }))
  const bookings = (payload.value?.latest.bookings ?? []).map((b) => ({ kind: 'booking' as const, item: b }))
  return [...leads, ...bookings].sort((a, b) => (b.item.createdAt ?? 0) - (a.item.createdAt ?? 0)).slice(0, 6)
})

function toggle() {
  open.value = !open.value
  if (open.value) markRead()
}

function visit(href: string) {
  open.value = false
  router.push(href)
}

// Close the dropdown on outside click.
const root = ref<HTMLElement | null>(null)
onClickOutside(root, () => (open.value = false))
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      aria-label="Notificări"
      class="w-10 h-10 rounded-full border border-slate-200 dark:border-dark-border text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-dark-hover flex items-center justify-center transition shadow-sm relative"
      @click="toggle"
    >
      <Icon name="fa6-solid:bell" />
      <span
        v-if="unread > 0"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
      >
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>

    <Transition name="fade">
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-lg overflow-hidden z-50"
      >
        <div class="px-4 py-3 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Notificări</span>
          <button
            type="button"
            class="text-[11px] text-primary hover:underline"
            @click="refresh"
          >
            <Icon name="fa6-solid:rotate" /> Reîmprospătează
          </button>
        </div>

        <div v-if="!items.length" class="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Nu există evenimente noi.
        </div>

        <ul v-else class="max-h-80 overflow-y-auto">
          <li
            v-for="entry in items"
            :key="entry.kind + ':' + entry.item.id"
            class="px-4 py-3 border-b border-slate-100 dark:border-dark-border last:border-0 hover:bg-slate-50 dark:hover:bg-dark-hover cursor-pointer"
            @click="visit(entry.kind === 'lead' ? `/admin/leads?tab=leads&focus=${entry.item.id}` : `/admin/leads?tab=bookings&focus=${entry.item.id}`)"
          >
            <div class="flex items-start gap-2">
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                :class="entry.kind === 'lead' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'"
              >
                <Icon :name="entry.kind === 'lead' ? 'fa6-solid:envelope' : 'fa6-solid:calendar-check'" />
              </span>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {{ entry.kind === 'lead' ? 'Comandă nouă' : 'Programare nouă' }}
                </p>
                <p class="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                  {{ entry.item.name || '—' }}
                  <span v-if="entry.kind === 'booking' && entry.item.serviceSlug">
                    • {{ entry.item.serviceSlug }} • {{ entry.item.date }}
                  </span>
                </p>
              </div>
            </div>
          </li>
        </ul>

        <div class="px-4 py-2 border-t border-slate-100 dark:border-dark-border flex justify-between items-center">
          <NuxtLink to="/admin/notifications" class="text-[11px] text-primary hover:underline" @click="open = false">
            Setări notificări
          </NuxtLink>
          <NuxtLink to="/admin/telegram" class="text-[11px] text-primary hover:underline" @click="open = false">
            Telegram
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease, transform 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
