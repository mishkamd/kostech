<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Admin login — Kostech', robots: 'noindex,nofollow' })

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const submit = async () => {
  errorMsg.value = ''
  submitting.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { username: username.value, password: password.value },
    })
    await navigateTo('/admin')
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'Credențiale incorecte'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <BentoCard>
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <Icon name="fa6-solid:microchip" class="text-lg" />
        </div>
        <div>
          <h1 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">Admin Kostech</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">Autentifică-te pentru a continua</p>
        </div>
      </div>
      <form class="space-y-3" @submit.prevent="submit">
        <UiInput
          v-model="username"
          label="Utilizator"
          id="username"
          autocomplete="username"
          placeholder="admin"
          required
        />
        <UiInput
          v-model="password"
          type="password"
          label="Parolă"
          id="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
        <p v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</p>
        <UiButton type="submit" :disabled="submitting" block>
          {{ submitting ? 'Se verifică…' : 'Autentifică-te' }}
        </UiButton>
      </form>
    </BentoCard>
  </div>
</template>
