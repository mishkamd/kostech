<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const locales = [
  { code: 'ro', label: 'RO' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

const mobileMenuOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { mobileMenuOpen.value = false })
</script>

<template>
  <header
    class="bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card mb-8 transition-colors duration-300"
  >
    <div class="relative px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex items-center justify-between gap-2 sm:gap-4">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2 sm:gap-3 group shrink-0">
        <div class="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-sm">
          <Icon name="fa6-solid:microchip" class="text-base sm:text-lg" />
        </div>
        <span class="font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">Kostech</span>
      </NuxtLink>

      <nav class="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
        <NuxtLink :to="localePath('/servicii')" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition">{{ t('nav.services') }}</NuxtLink>
        <NuxtLink :to="localePath('/booking')" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition">{{ t('nav.booking') }}</NuxtLink>
      </nav>

      <div class="flex items-center gap-1.5 sm:gap-3">
        <!-- Booking CTA (hidden on mobile) -->
        <NuxtLink
          :to="localePath('/booking')"
          class="hidden sm:inline-flex items-center gap-1.5 min-h-9 px-4 text-sm rounded-xl font-semibold bg-primary text-white hover:bg-primary-hover transition shadow-sm"
        >
          <Icon name="fa6-solid:calendar-days" class="text-xs" />
          {{ t('nav.booking') }}
        </NuxtLink>

        <!-- Language switcher -->
        <div class="flex items-center gap-0.5 bg-slate-50 dark:bg-dark-bg rounded-full border border-slate-100 dark:border-dark-border p-0.5 sm:p-1">
          <NuxtLink
            v-for="loc in locales"
            :key="loc.code"
            :to="switchLocalePath(loc.code as 'ro' | 'ru' | 'en')"
            class="px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-colors"
            :class="locale === loc.code
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-primary'"
          >
            {{ loc.label }}
          </NuxtLink>
        </div>

        <ThemeToggle />

        <!-- Hamburger (mobile only) -->
        <button
          class="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-dark-hover transition"
          :aria-label="mobileMenuOpen ? 'Închide meniu' : 'Deschide meniu'"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <Icon :name="mobileMenuOpen ? 'fa6-solid:xmark' : 'fa6-solid:bars'" class="text-sm" />
        </button>
      </div>
    </div>

    <!-- Mobile nav drawer -->
    <div v-show="mobileMenuOpen" class="lg:hidden border-t border-slate-100 dark:border-dark-border px-4 sm:px-6 py-3 space-y-1">
      <NuxtLink
        :to="localePath('/servicii')"
        class="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-hover transition text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        <Icon name="fa6-solid:server" class="text-primary text-sm shrink-0" />
        {{ t('nav.services') }}
      </NuxtLink>
      <NuxtLink
        :to="localePath('/booking')"
        class="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition text-sm font-semibold text-primary"
      >
        <Icon name="fa6-solid:calendar-days" class="text-sm shrink-0" />
        {{ t('nav.booking') }}
      </NuxtLink>
    </div>
  </header>
</template>
