<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Telegram — Kostech Admin', robots: 'noindex,nofollow' })

interface SettingsShape {
  telegram: {
    botToken: string
    chatId: string
    enabled: boolean
    configured: boolean
    webhookActive: boolean
  }
  notifications: {
    leadCreated: boolean
    bookingCreated: boolean
    leadStatusChanged: boolean
    bookingStatusChanged: boolean
  }
  lastReadAt: number
  updatedAt: number
}

const settings = ref<SettingsShape | null>(null)
const tokenInput = ref('')
const chatId = ref('')
const enabled = ref(false)
const loading = ref(true)
const saving = ref(false)
const savedMsg = ref('')
const errorMsg = ref('')

// Test
const testMessage = ref('')
const testing = ref(false)
const testResult = ref<{ ok: boolean; description?: string } | null>(null)

// Webhook
const webhookSetupMsg = ref('')
const webhookError = ref('')
const webhookWorking = ref(false)
const webhookInfo = ref<{ url?: string; pending_update_count?: number; last_error_message?: string } | null>(null)

async function fetchWebhookInfo() {
  if (!settings.value?.telegram.configured) return
  try {
    const res = await $fetch<{ ok: boolean; info: any; webhookActive: boolean }>('/api/admin/telegram/webhook-setup', {
      method: 'POST',
      body: { action: 'info' },
    })
    webhookInfo.value = res.info
  } catch { /* ignore */ }
}

async function setupWebhook() {
  webhookSetupMsg.value = ''
  webhookError.value = ''
  webhookWorking.value = true
  try {
    const res = await $fetch<{ ok: boolean; webhookUrl: string }>('/api/admin/telegram/webhook-setup', {
      method: 'POST',
      body: { action: 'setup' },
    })
    webhookSetupMsg.value = `Webhook activ: ${res.webhookUrl}`
    await load()
    await fetchWebhookInfo()
  } catch (e: any) {
    webhookError.value = e?.data?.statusMessage || 'Eroare la configurare'
  } finally {
    webhookWorking.value = false
  }
}

async function removeWebhook() {
  if (!confirm('Elimini webhook-ul Telegram? Botul nu va mai răspunde la comenzi.')) return
  webhookSetupMsg.value = ''
  webhookError.value = ''
  webhookWorking.value = true
  try {
    await $fetch('/api/admin/telegram/webhook-setup', { method: 'POST', body: { action: 'delete' } })
    webhookSetupMsg.value = 'Webhook eliminat.'
    webhookInfo.value = null
    await load()
  } catch (e: any) {
    webhookError.value = e?.data?.statusMessage || 'Eroare'
  } finally {
    webhookWorking.value = false
  }
}

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<SettingsShape>('/api/admin/settings')
    settings.value = data
    chatId.value = data.telegram.chatId
    enabled.value = data.telegram.enabled
    tokenInput.value = ''
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare la încărcare'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  savedMsg.value = ''
  errorMsg.value = ''
  try {
    const body: Record<string, unknown> = {
      telegram: {
        chatId: chatId.value,
        enabled: enabled.value,
        // Only send the token if the user actually typed something. The '****'
        // marker is the explicit "no change" signal handled by the server.
        botToken: tokenInput.value ? tokenInput.value : '****',
      },
    }
    const res = await $fetch<{ ok: boolean; settings: SettingsShape }>('/api/admin/settings', {
      method: 'PUT',
      body,
    })
    settings.value = res.settings
    tokenInput.value = ''
    savedMsg.value = 'Setări salvate.'
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare la salvare'
  } finally {
    saving.value = false
  }
}

async function clearToken() {
  if (!confirm('Ștergi token-ul salvat? Notificările Telegram vor fi dezactivate.')) return
  saving.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch<{ ok: boolean; settings: SettingsShape }>('/api/admin/settings', {
      method: 'PUT',
      body: { telegram: { botToken: null, chatId: chatId.value, enabled: false } },
    })
    settings.value = res.settings
    enabled.value = false
    savedMsg.value = 'Token șters.'
    setTimeout(() => (savedMsg.value = ''), 3000)
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'Eroare'
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  testing.value = true
  testResult.value = null
  errorMsg.value = ''
  try {
    const res = await $fetch<{ ok: boolean; result: { ok: boolean; description?: string; status?: number } }>(
      '/api/admin/telegram/test',
      {
        method: 'POST',
        body: testMessage.value ? { message: testMessage.value } : {},
      },
    )
    testResult.value = {
      ok: res.result.ok,
      description: res.result.description,
    }
  } catch (e: any) {
    testResult.value = { ok: false, description: e?.data?.message || 'Eroare' }
  } finally {
    testing.value = false
  }
}

const hasToken = computed(() => Boolean(settings.value?.telegram.botToken))
const configStatus = computed(() => {
  if (!hasToken.value) return { label: 'Bot neconfigurat', color: 'slate' as const }
  if (!enabled.value) return { label: 'Bot conectat, notificări dezactivate', color: 'amber' as const }
  return { label: 'Bot conectat și activ', color: 'green' as const }
})

await load()
await fetchWebhookInfo()
</script>

<template>
  <div>
    <!-- Header -->
    <BentoCard class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Icon name="fa6-brands:telegram" class="text-xl" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Notificări Telegram</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Primește alerte pe Telegram pentru comenzi noi, programări și schimbări de status.
            </p>
          </div>
        </div>
        <span
          class="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
          :class="{
            'bg-slate-100 text-slate-600 dark:bg-dark-bg dark:text-slate-300': configStatus.color === 'slate',
            'bg-amber-500/10 text-amber-700 dark:text-amber-400': configStatus.color === 'amber',
            'bg-green-500/10 text-green-700 dark:text-green-400': configStatus.color === 'green',
          }"
        >
          {{ configStatus.label }}
        </span>
      </div>
    </BentoCard>

    <div v-if="loading" class="text-center py-20 text-slate-500">
      <Icon name="fa6-solid:spinner" class="animate-spin text-2xl" />
    </div>

    <template v-else>
      <!-- Configuration card -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Configurare bot</h2>

        <div class="space-y-4">
          <div>
            <label for="tg-token" class="block text-sm font-semibold mb-1 dark:text-slate-300">Bot Token</label>
            <div class="flex gap-2 items-stretch">
              <input
                id="tg-token"
                v-model="tokenInput"
                type="password"
                autocomplete="off"
                :placeholder="hasToken ? `Token salvat (${settings?.telegram.botToken}). Lasă gol pentru a păstra.` : '123456789:AAH...'"
                class="flex-1 bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-xl px-4 py-3 text-sm font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                v-if="hasToken"
                type="button"
                class="px-3 py-2 rounded-xl border border-slate-200 dark:border-dark-border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs font-semibold"
                :disabled="saving"
                @click="clearToken"
              >
                <Icon name="fa6-solid:trash" /> Șterge
              </button>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Obții token-ul de la <span class="font-mono">@BotFather</span> în Telegram. Token-ul nu se afișează niciodată înapoi.
            </p>
          </div>

          <UiInput
            v-model="chatId"
            label="Chat ID"
            id="tg-chat"
            placeholder="123456789 sau -100… pentru grup"
          />

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="enabled"
              type="checkbox"
              class="w-5 h-5 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/40"
            >
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Activează notificările Telegram
            </span>
          </label>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="text-xs px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              :disabled="saving"
              @click="save"
            >
              <Icon name="fa6-solid:floppy-disk" class="mr-1" />
              {{ saving ? 'Se salvează…' : 'Salvează' }}
            </button>
            <span v-if="savedMsg" class="text-xs text-green-600"><Icon name="fa6-solid:check" /> {{ savedMsg }}</span>
            <span v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</span>
          </div>
        </div>
      </BentoCard>

      <!-- Test card -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Test conexiune</h2>
        <div class="flex flex-col sm:flex-row gap-2 items-stretch">
          <input
            v-model="testMessage"
            type="text"
            placeholder="Mesaj custom (opțional)"
            class="flex-1 bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            @keyup.enter="sendTest"
          >
          <button
            type="button"
            class="text-xs px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            :disabled="testing || !hasToken || !chatId"
            @click="sendTest"
          >
            <Icon name="fa6-solid:paper-plane" class="mr-1" />
            {{ testing ? 'Se trimite…' : 'Trimite mesaj test' }}
          </button>
        </div>
        <p v-if="!hasToken" class="text-[11px] text-slate-500 mt-2">
          Setează mai întâi un Bot Token pentru a putea testa.
        </p>

        <div v-if="testResult" class="mt-4 p-3 rounded-xl text-xs flex items-start gap-2"
          :class="testResult.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
          <Icon :name="testResult.ok ? 'fa6-solid:check-circle' : 'fa6-solid:triangle-exclamation'" class="text-base mt-0.5" />
          <div>
            <p class="font-semibold">{{ testResult.ok ? 'Mesaj trimis cu succes!' : 'Trimiterea a eșuat' }}</p>
            <p v-if="testResult.description" class="opacity-80 mt-0.5">{{ testResult.description }}</p>
          </div>
        </div>
      </BentoCard>

      <!-- Webhook + Bot interactiv -->
      <BentoCard class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider">Bot interactiv (webhook)</h2>
          <span
            class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            :class="settings?.telegram.webhookActive
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-slate-100 text-slate-500 dark:bg-dark-bg dark:text-slate-400'"
          >
            {{ settings?.telegram.webhookActive ? 'Activ' : 'Inactiv' }}
          </span>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Activează webhook-ul pentru ca botul să răspundă la comenzi interactive: cereri, programări, statistici și acces la panoul admin din Telegram.
        </p>

        <!-- Current webhook info -->
        <div v-if="webhookInfo?.url" class="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border text-xs font-mono break-all text-slate-600 dark:text-slate-300">
          <p class="font-semibold text-slate-800 dark:text-white mb-1">URL activ:</p>
          <p>{{ webhookInfo.url }}</p>
          <p v-if="webhookInfo.last_error_message" class="text-red-500 mt-1">⚠️ {{ webhookInfo.last_error_message }}</p>
        </div>

        <!-- Commands reference -->
        <div class="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p class="font-semibold text-slate-800 dark:text-white mb-2">Comenzi disponibile:</p>
          <p><code class="text-primary">/start</code> — Meniu principal cu butoane</p>
          <p><code class="text-primary">/cereri</code> — Ultimele 5 cereri</p>
          <p><code class="text-primary">/programari</code> — Ultimele 5 programări</p>
          <p><code class="text-primary">/statistici</code> — Statistici generale</p>
          <p><code class="text-primary">/ajutor</code> — Lista comenzilor</p>
        </div>

        <p v-if="webhookSetupMsg" class="text-xs text-green-600 dark:text-green-400 mb-3">
          <Icon name="fa6-solid:check" class="mr-1" />{{ webhookSetupMsg }}
        </p>
        <p v-if="webhookError" class="text-xs text-red-500 mb-3">{{ webhookError }}</p>

        <div class="flex gap-2">
          <button
            type="button"
            class="text-xs px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            :disabled="webhookWorking || !hasToken"
            @click="setupWebhook"
          >
            <Icon name="fa6-solid:plug" class="mr-1" />
            {{ webhookWorking ? 'Se configurează…' : (settings?.telegram.webhookActive ? 'Reconfigurează webhook' : 'Activează webhook') }}
          </button>
          <button
            v-if="settings?.telegram.webhookActive"
            type="button"
            class="text-xs px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition disabled:opacity-50"
            :disabled="webhookWorking"
            @click="removeWebhook"
          >
            <Icon name="fa6-solid:plug-circle-xmark" class="mr-1" />Dezactivează
          </button>
        </div>
        <p v-if="!hasToken" class="text-[11px] text-slate-500 mt-2">
          Setează mai întâi un Bot Token.
        </p>
        <p v-else class="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
          Serverul trebuie să fie accesibil public (HTTPS). Setează <code>NUXT_PUBLIC_SITE_URL</code> în mediu.
        </p>
      </BentoCard>

      <!-- Mini App -->
      <BentoCard class="mb-6">
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Mini App Telegram</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Botul include un buton <b>Deschide panoul admin</b> care deschide interfața de admin direct în Telegram, fără browser separat.
        </p>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-100 dark:border-dark-border text-xs text-slate-600 dark:text-slate-300 space-y-2">
          <p><Icon name="fa6-solid:circle-check" class="text-green-500 mr-1" /><b>Integrat automat</b> — butonul apare în meniul principal al botului</p>
          <p><Icon name="fa6-solid:circle-check" class="text-green-500 mr-1" />Trimite <code>/start</code> botului și apasă <b>🌐 Deschide panoul admin</b></p>
          <p><Icon name="fa6-solid:triangle-exclamation" class="text-amber-500 mr-1" />Necesită <code>NUXT_PUBLIC_SITE_URL</code> setat corect și webhook activ</p>
        </div>
      </BentoCard>

      <!-- How-to card -->
      <BentoCard>
        <h2 class="text-[11px] font-bold text-primary uppercase tracking-wider mb-4">Cum configurezi un bot Telegram</h2>
        <ol class="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
          <li>
            Deschide Telegram și caută <span class="font-mono text-primary">@BotFather</span>.
            Trimite comanda <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-bg text-xs">/newbot</code>,
            alege un nume și un username care se termină în <code class="text-xs">bot</code>.
          </li>
          <li>
            Copiază token-ul primit (arată ca <code class="text-xs">123456789:AAHxxxxxxxxxxxx</code>) și lipește-l mai sus.
          </li>
          <li>
            Deschide conversația cu botul tău și trimite <code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-dark-bg text-xs">/start</code>.
            Apoi extrage <b>chat ID</b>-ul tău:
            <details class="mt-2">
              <summary class="cursor-pointer text-primary text-xs">arată comanda curl</summary>
              <pre class="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-dark-bg text-[11px] overflow-x-auto"><code>curl "https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates"</code></pre>
              <p class="text-[11px] text-slate-500 mt-1">
                Caută în răspuns <code>"chat":{"id": 123456789, …}</code> — aceea este valoarea pentru Chat ID.
                Pentru grupuri, ID-ul este negativ (ex. <code>-100…</code>) — adaugă botul în grup și trimite un mesaj acolo.
              </p>
            </details>
          </li>
          <li>
            Lipește Chat ID-ul, bifează <i>Activează notificările</i> și apasă <b>Salvează</b>.
            Folosește butonul <b>Trimite mesaj test</b> pentru a verifica imediat.
          </li>
        </ol>
      </BentoCard>
    </template>
  </div>
</template>
