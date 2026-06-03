<script setup lang="ts">
defineProps<{ modelValue?: string | number; label?: string; id?: string }>()
defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>

<template>
  <label v-if="label" :for="id" class="block text-sm font-semibold mb-1 dark:text-slate-300">{{ label }}</label>
  <input
    :id="id"
    :value="modelValue"
    v-bind="$attrs"
    class="w-full bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
