<script setup lang="ts">
const { messages, dismiss } = useToast()

function kindClass(kind?: string) {
  switch (kind) {
    case 'lead': return 'border-l-4 border-primary'
    case 'booking': return 'border-l-4 border-amber-500'
    case 'success': return 'border-l-4 border-green-500'
    case 'error': return 'border-l-4 border-red-500'
    default: return 'border-l-4 border-slate-300 dark:border-dark-border'
  }
}

function kindIcon(kind?: string) {
  switch (kind) {
    case 'lead': return 'fa6-solid:envelope'
    case 'booking': return 'fa6-solid:calendar-check'
    case 'success': return 'fa6-solid:check'
    case 'error': return 'fa6-solid:triangle-exclamation'
    default: return 'fa6-solid:circle-info'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in messages"
          :key="t.id"
          class="pointer-events-auto bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-lg p-3 flex items-start gap-3"
          :class="kindClass(t.kind)"
        >
          <span class="w-8 h-8 rounded-full bg-slate-100 dark:bg-dark-bg flex items-center justify-center shrink-0 text-primary">
            <Icon :name="kindIcon(t.kind)" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-slate-900 dark:text-white">{{ t.title }}</p>
            <p v-if="t.body" class="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 break-words">{{ t.body }}</p>
            <div v-if="t.action || t.href" class="mt-1.5 flex gap-2">
              <NuxtLink
                v-if="t.href"
                :to="t.href"
                class="text-[11px] text-primary hover:underline"
                @click="dismiss(t.id)"
              >
                Deschide
              </NuxtLink>
              <button
                v-if="t.action"
                type="button"
                class="text-[11px] text-primary hover:underline"
                @click="t.action?.onClick?.(); dismiss(t.id)"
              >
                {{ t.action.label }}
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Închide"
            class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            @click="dismiss(t.id)"
          >
            <Icon name="fa6-solid:xmark" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 200ms ease, transform 200ms ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
</style>
