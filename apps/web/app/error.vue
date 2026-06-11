<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number } }>()

if (props.error.statusCode === 404) {
  await navigateTo('/', { replace: true })
}
</script>

<template>
  <div />
</template>
