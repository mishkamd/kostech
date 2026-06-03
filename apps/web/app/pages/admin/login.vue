<script setup lang="ts">
definePageMeta({ layout: 'default' })
useSeoMeta({ title: 'Admin login — Kostech', robots: 'noindex,nofollow' })

const token = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const submit = async () => {
  errorMsg.value = ''
  submitting.value = true
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { token: token.value } })
    await navigateTo('/admin')
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Token invalid'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <BentoCard>
      <h1 class="text-xl font-bold text-slate-900 dark:text-white mb-1">Admin Kostech</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Introdu token-ul de acces pentru a continua.
      </p>
      <form class="space-y-3" @submit.prevent="submit">
        <UiInput v-model="token" type="password" label="Token admin" id="tok" required />
        <p v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</p>
        <UiButton type="submit" :disabled="submitting" block>
          {{ submitting ? 'Se verifică…' : 'Autentifică-te' }}
        </UiButton>
      </form>
    </BentoCard>
  </div>
</template>
