<script setup lang="ts">
const colorMode = useColorMode()
const toggle = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
const isDark = computed(() => colorMode.value === 'dark')
</script>

<template>
  <button
    type="button"
    :aria-label="isDark ? 'Activează modul luminos' : 'Activează modul întunecat'"
    class="w-10 h-10 rounded-full border border-slate-200 dark:border-dark-border text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-dark-hover flex items-center justify-center transition shadow-sm"
    @click="toggle"
  >
    <Icon v-if="!isDark" name="fa6-solid:moon" />
    <Icon v-else name="fa6-solid:sun" />
  </button>
</template>
