<script setup lang="ts">
const props = withDefaults(defineProps<{ padded?: boolean; flush?: boolean }>(), {
  padded: true,
  flush: false,
})
</script>

<template>
  <div
    class="bento-item bg-white dark:bg-dark-card border border-transparent dark:border-dark-border rounded-bento shadow-card dark:shadow-dark-card transition-colors duration-300"
    :class="[padded && !flush ? 'p-6' : '', flush ? 'overflow-hidden' : '']"
  >
    <slot />
  </div>
</template>
