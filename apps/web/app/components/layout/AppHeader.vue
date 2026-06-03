<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()

const locales = [
  { code: 'ro', label: 'RO' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]
</script>

<template>
  <header
    class="bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card mb-8 transition-colors duration-300"
  >
    <div class="relative px-6 md:px-8 py-5 flex items-center justify-between gap-4">
      <NuxtLink :to="localePath('/')" class="flex items-center gap-3 group">
        <div class="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center shadow-sm">
          <Icon name="fa6-solid:microchip" class="text-lg" />
        </div>
        <span class="font-bold text-xl text-slate-900 dark:text-white hidden sm:block tracking-tight">Kostech</span>
      </NuxtLink>

      <nav class="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
        <NuxtLink :to="localePath('/servicii')" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition">{{ t('nav.services') }}</NuxtLink>
        <NuxtLink :to="localePath('/booking')" class="px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition">{{ t('nav.booking') }}</NuxtLink>
      </nav>

      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Language switcher -->
        <div class="flex items-center gap-1 bg-slate-50 dark:bg-dark-bg rounded-full border border-slate-100 dark:border-dark-border p-1">
          <NuxtLink
            v-for="loc in locales"
            :key="loc.code"
            :to="switchLocalePath(loc.code)"
            class="px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors"
            :class="locale === loc.code
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-primary'"
          >
            {{ loc.label }}
          </NuxtLink>
        </div>

        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
