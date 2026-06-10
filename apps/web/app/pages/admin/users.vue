<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Utilizatori — Admin Kostech', robots: 'noindex,nofollow' })

interface User { id: string; username: string; createdAt: string }

const { data: users, refresh } = await useFetch<User[]>('/api/admin/users')

// Create
const createForm = reactive({ username: '', password: '' })
const creating = ref(false)
const createError = ref('')

async function createUser() {
  createError.value = ''
  creating.value = true
  try {
    await $fetch('/api/admin/users', { method: 'POST', body: createForm })
    createForm.username = ''
    createForm.password = ''
    await refresh()
  } catch (e: any) {
    createError.value = e?.data?.statusMessage || 'Eroare la creare'
  } finally {
    creating.value = false
  }
}

// Edit
const editingId = ref<string | null>(null)
const editForm = reactive({ username: '', password: '' })
const editError = ref('')
const saving = ref(false)

function startEdit(u: User) {
  editingId.value = u.id
  editForm.username = u.username
  editForm.password = ''
  editError.value = ''
}

function cancelEdit() {
  editingId.value = null
}

async function saveEdit() {
  editError.value = ''
  saving.value = true
  try {
    const body: Record<string, string> = {}
    if (editForm.username) body.username = editForm.username
    if (editForm.password) body.password = editForm.password
    await $fetch(`/api/admin/users/${editingId.value}`, { method: 'PATCH', body })
    editingId.value = null
    await refresh()
  } catch (e: any) {
    editError.value = e?.data?.statusMessage || 'Eroare la salvare'
  } finally {
    saving.value = false
  }
}

// Delete
const deletingId = ref<string | null>(null)
const deleteError = ref('')

async function deleteUser(id: string) {
  deleteError.value = ''
  deletingId.value = id
  try {
    await $fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage || 'Eroare la ștergere'
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Utilizatori admin</h1>
    </div>

    <!-- User list -->
    <BentoCard>
      <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Utilizatori existenți</h2>
      <p v-if="deleteError" class="text-xs text-red-500 mb-3">{{ deleteError }}</p>
      <div class="space-y-2">
        <div
          v-for="u in (users ?? [])" :key="u.id"
          class="rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-dark-bg p-3"
        >
          <!-- View mode -->
          <template v-if="editingId !== u.id">
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {{ u.username[0]?.toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-sm text-slate-900 dark:text-white">{{ u.username }}</p>
                  <p class="text-xs text-slate-400">{{ new Date(u.createdAt).toLocaleDateString('ro-RO') }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-hover text-slate-500 flex items-center justify-center transition"
                  @click="startEdit(u)"
                  title="Editează"
                >
                  <Icon name="fa6-solid:pen" class="text-xs" />
                </button>
                <button
                  class="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 flex items-center justify-center transition"
                  :disabled="deletingId === u.id"
                  @click="deleteUser(u.id)"
                  title="Șterge"
                >
                  <Icon name="fa6-solid:trash" class="text-xs" />
                </button>
              </div>
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="space-y-2">
              <UiInput v-model="editForm.username" label="Utilizator" id="edit-username" placeholder="username" />
              <UiInput v-model="editForm.password" type="password" label="Parolă nouă (opțional)" id="edit-password" placeholder="lasă gol pentru a păstra" />
              <p v-if="editError" class="text-xs text-red-500">{{ editError }}</p>
              <div class="flex gap-2 pt-1">
                <UiButton size="sm" :disabled="saving" @click="saveEdit">
                  {{ saving ? 'Se salvează…' : 'Salvează' }}
                </UiButton>
                <UiButton size="sm" variant="outline" @click="cancelEdit">Anulează</UiButton>
              </div>
            </div>
          </template>
        </div>

        <p v-if="!users?.length" class="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
          Nu există utilizatori.
        </p>
      </div>
    </BentoCard>

    <!-- Create user -->
    <BentoCard>
      <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Adaugă utilizator</h2>
      <form class="space-y-3" @submit.prevent="createUser">
        <UiInput v-model="createForm.username" label="Utilizator" id="new-username" placeholder="username" required />
        <UiInput v-model="createForm.password" type="password" label="Parolă" id="new-password" placeholder="••••••••" required />
        <p v-if="createError" class="text-xs text-red-500">{{ createError }}</p>
        <UiButton type="submit" :disabled="creating">
          {{ creating ? 'Se creează…' : 'Creează utilizator' }}
        </UiButton>
      </form>
    </BentoCard>
  </div>
</template>
