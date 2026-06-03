<script setup lang="ts">
type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    to?: string
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-primary',
  outline:
    'border border-slate-200 dark:border-dark-border text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-hover',
  ghost:
    'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-hover',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-4 text-sm',
  md: 'min-h-11 px-6 text-sm',
  lg: 'min-h-12 px-7 text-base',
}

const cls = computed(() => [
  base,
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="cls"><slot /></NuxtLink>
  <a v-else-if="href" :href="href" :class="cls"><slot /></a>
  <button v-else :type="type" :disabled="disabled" :class="cls"><slot /></button>
</template>
