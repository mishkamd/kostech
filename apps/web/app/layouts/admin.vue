<script setup lang="ts">
// Mount the polling + bell as soon as the admin layout is active. The
// composable is a singleton, so it won't double-start if a page also calls
// useAdminNotifications().
useAdminNotifications()

const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <header class="bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card mb-8">
      <div class="px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <NuxtLink to="/admin" class="flex items-center gap-3 group" aria-label="Mergi la Dashboard">
          <div class="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-sm">
            <Icon name="fa6-solid:microchip" class="text-lg" />
          </div>
        </NuxtLink>

        <!-- Desktop menu -->
        <nav class="hidden md:flex items-center justify-center gap-1 text-sm flex-wrap">
          <NuxtLink to="/admin/content" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Conținut</NuxtLink>
          <NuxtLink to="/admin/services" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Servicii</NuxtLink>
          <NuxtLink to="/admin/leads" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Cereri</NuxtLink>
          <NuxtLink to="/admin/telegram" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Telegram</NuxtLink>
          <NuxtLink to="/admin/notifications" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Notificări</NuxtLink>
        </nav>
        <div class="hidden md:flex items-center gap-2">
          <AdminNotificationsBell />
          <ThemeToggle />
        </div>

        <!-- Mobile menu button -->
        <button
          class="md:hidden w-10 h-10 rounded-lg border border-slate-200 dark:border-dark-border flex items-center justify-center hover:bg-slate-50 dark:hover:bg-dark-hover"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Meniu"
        >
          <Icon :name="mobileMenuOpen ? 'fa6-solid:xmark' : 'fa6-solid:bars'" />
        </button>
      </div>

      <!-- Mobile menu dropdown -->
      <Transition name="slide">
        <div v-if="mobileMenuOpen" class="md:hidden px-4 pb-4 border-t border-slate-100 dark:border-dark-border pt-4 flex flex-col items-center">
          <nav class="flex flex-col gap-1 text-sm w-full max-w-xs items-center">
            <NuxtLink to="/admin/content" @click="mobileMenuOpen = false" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Conținut</NuxtLink>
            <NuxtLink to="/admin/services" @click="mobileMenuOpen = false" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Servicii</NuxtLink>
            <NuxtLink to="/admin/leads" @click="mobileMenuOpen = false" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Cereri</NuxtLink>
            <NuxtLink to="/admin/telegram" @click="mobileMenuOpen = false" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Telegram</NuxtLink>
            <NuxtLink to="/admin/notifications" @click="mobileMenuOpen = false" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover text-slate-600 dark:text-slate-300">Notificări</NuxtLink>
          </nav>
          <div class="flex items-center gap-2 mt-4">
            <AdminNotificationsBell />
            <ThemeToggle />
          </div>
        </div>
      </Transition>
    </header>
    <main>
      <slot />
    </main>
    <ToastContainer />
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
