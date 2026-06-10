<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: services } = await useFetch('/api/content/services', {
  query: computed(() => ({ lang: locale.value })),
  watch: [locale],
  default: () => [],
})

const footerServices = computed(() => services.value.slice(0, 4))
</script>

<template>
  <footer class="mt-8">
    <div class="bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card p-6 sm:p-8 grid gap-6 sm:gap-8 grid-cols-2 md:grid-cols-4">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 bg-primary/10 dark:bg-primary/20 text-primary rounded-full flex items-center justify-center">
            <Icon name="fa6-solid:microchip" />
          </div>
          <span class="font-bold text-lg text-slate-900 dark:text-white">Kostech</span>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {{ t('footer.tagline') }}
        </p>
      </div>

      <div>
        <h4 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">{{ t('footer.services') }}</h4>
        <ul class="space-y-2 text-sm">
          <li v-for="s in footerServices" :key="s.slug">
            <NuxtLink :to="localePath(`/servicii/${s.slug}`)" class="hover:text-primary text-slate-600 dark:text-slate-400">{{ s.title }}</NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">{{ t('footer.company') }}</h4>
        <ul class="space-y-2 text-sm">
          <li><NuxtLink :to="localePath('/booking')" class="hover:text-primary text-slate-600 dark:text-slate-400">{{ t('footer.bookVisit') }}</NuxtLink></li>
          <li><a href="/admin" class="hover:text-primary text-slate-600 dark:text-slate-400">{{ t('footer.admin') }}</a></li>
        </ul>
      </div>

      <div>
        <h4 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-3">{{ t('footer.contact') }}</h4>
        <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li class="flex items-center gap-2"><Icon name="fa6-solid:phone" /> <a href="tel:+37378643740" class="hover:text-primary">+373 78 643 740</a></li>
          <li class="flex items-center gap-2"><Icon name="fa6-solid:envelope" /> <a href="mailto:hello@kostech.md" class="hover:text-primary">hello@kostech.md</a></li>
          <li class="flex items-center gap-2"><Icon name="fa6-regular:paper-plane" /> {{ t('footer.city') }}</li>
        </ul>
      </div>
    </div>
    <p class="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
      © {{ new Date().getFullYear() }} Kostech. {{ t('footer.rights') }}
    </p>
  </footer>
</template>
