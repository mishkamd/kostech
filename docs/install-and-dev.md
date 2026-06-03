# Instalare & dezvoltare locală

## 1. Cerințe sistem

| Componentă | Versiune minimă | Verificare |
| --- | --- | --- |
| Node.js | 20.19 (rec. 22 LTS) | `node -v` |
| pnpm | 9.15.9 | `pnpm -v` (sau `corepack enable`) |
| git | 2.30+ | `git --version` |
| glibc (Linux, doar pentru `wrangler dev`) | 2.35+ | `ldd --version` |

## 1a. Notificări admin & Telegram bot

Aplicația include un sistem intern de notificări pentru admin, plus opțiunea de a trimite alerte și pe Telegram.

### Componente

- **Clopoțel cu badge** în header-ul admin (iconița `fa6-solid:bell`) — polling la **20 s** către `GET /api/admin/notifications/count`; badge-ul afișează câte lead-uri / programări au `status === 'new'` și au fost create după `lastReadAt`.
- **Toast-uri in-house** — pentru evenimente noi apărute în timp ce ești logat.
- **Pagina `/admin/telegram`** — lipești Bot Token + Chat ID, activezi/dezactivezi, testezi.
- **Pagina `/admin/notifications`** — toggle-uri per eveniment + stare (`lastReadAt`, necitite acum).

### Evenimente declanșate (toate ON implicit)

| Eveniment | Endpoint trigger |
| --- | --- |
| Lead nou (formular contact) | `POST /api/contact` |
| Programare nouă (wizard /booking) | `POST /api/bookings` |
| Lead — schimbare status | `PATCH /api/admin/leads/:id` |
| Programare — schimbare status | `PATCH /api/admin/bookings/:id` |

### Configurare Telegram (3 pași)

1. Deschide Telegram → caută `@BotFather` → `/newbot` → alegi nume + username (se termină în `bot`) → primești token-ul (`123456789:AAHxxxxx`).
2. Deschide conversația cu botul tău, trimite `/start`. Apoi extrage chat ID-ul:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   ```
   Caută `chat.id` în răspuns (pozitiv pentru conversație privată, negativ pentru grup).
3. În admin: deschide `/admin/telegram`, lipește token-ul + chat ID, bifează *Activează*, apasă **Salvează**, apoi **Trimite mesaj test** pentru a verifica.

### Persistență

Setările se salvează ca **un singur blob JSON** sub cheia KV `settings:admin` (același pattern ca `content:homepage:<lang>`). Token-ul este **write-only** — endpoint-ul `GET /api/admin/settings` returnează doar `****<ultimele 4 caractere>`, niciodată plaintext.

### Fallback și fiabilitate

- Token invalid / Telegram down: trimiterea eșuează silentios (log `[notify] telegram failed …` în consola server-ului), iar POST-ul public răspunde normal cu `200 {ok:true}`.
- Timeout per request: 4 s (`AbortController`).
- Fără D1/Queue/Durable Objects — totul rulează pe Pages Functions + KV.
- **Nu e nevoie de niciun env var nou** — token-ul se setează din UI, nu prin deploy.



> Pe sisteme cu **glibc < 2.35** (Rocky 9, CentOS Stream 9), `wrangler dev` (workerd) NU rulează. Folosește `pnpm dev` — fallback automat la `Map` în memorie. Build-ul pentru deploy pe Cloudflare merge normal.

## 2. Clonare & instalare

```bash
git clone <repo-url> kostech
cd kostech
pnpm install
```

`postinstall` rulează automat: `nuxt prepare` + copiere `inter-variable-latin.woff2` în `public/fonts/`.

## 3. Variabile de mediu

```bash
cp apps/web/.env.example apps/web/.env
```

| Var | Obligatorie | Implicit dev | Notă |
| --- | :---: | --- | --- |
| `NUXT_ADMIN_TOKEN` | da (prod) | `dev-admin-token` | Token shared `/admin/login` |
| `NUXT_PUBLIC_SITE_URL` | nu | `https://kostech.md` | Canonical & OG URLs |
| `NUXT_TURNSTILE_SITE_KEY` | nu | gol | Public Turnstile (opțional) |
| `NUXT_TURNSTILE_SECRET_KEY` | nu | gol | Secret Turnstile (server-only) |

## 4. Comenzi disponibile

```bash
# Dev server pe http://127.0.0.1:3001
pnpm --filter @kostech/web dev

# Build pentru Cloudflare Pages
pnpm --filter @kostech/web build              # → apps/web/dist/

# Preview build local (Node)
pnpm --filter @kostech/web preview

# TypeScript strict check
pnpm --filter @kostech/web typecheck

# Regenerează cele 8 OG-images în public/og/
pnpm --filter @kostech/web og:generate

# Smoke tests E2E (necesită playwright install chromium)
pnpm --filter @kostech/web test:e2e
```

## 5. Pornire locală & smoke test rapid

### 5.1 Pornire

```bash
cd /opt/tech2
pnpm --filter @kostech/web dev
# sau în background:
cd apps/web && nohup pnpm dev > /tmp/dev.log 2>&1 & echo "PID=$!"
```

URL: <http://127.0.0.1:3001/>. Așteaptă ~10s până apare `Nuxt Nitro server built`.

### 5.2 Smoke test cu curl (fără browser)

```bash
# Pagini publice
for p in / /servicii /servicii/mentenanta-pc /servicii/administrare-servere \
         /servicii/proiectare-retele /servicii/securitate-it \
         /contact /booking /sitemap.xml /robots.txt /admin/login; do
  printf "%-40s " "$p"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:3001${p}"
done

# /admin trebuie să redirecționeze (302) către /admin/login
curl -s -o /dev/null -w "/admin → HTTP %{http_code}\n" --max-redirs 0 http://127.0.0.1:3001/admin

# POST contact
curl -s -X POST http://127.0.0.1:3001/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Ion","email":"ion@example.com","phone":"+37360000000","message":"Test mesaj minim 10 caractere."}'

# Auth admin: login + cookie reused pentru stats
curl -s -X POST http://127.0.0.1:3001/api/admin/login \
  -H 'content-type: application/json' \
  -d '{"token":"dev-admin-token"}' -c /tmp/cookie.txt
curl -s http://127.0.0.1:3001/api/admin/stats -b /tmp/cookie.txt

# Auth negative: fără cookie → 401
curl -s -o /dev/null -w "stats no-auth → HTTP %{http_code}\n" \
  http://127.0.0.1:3001/api/admin/stats

# Security headers
curl -sI http://127.0.0.1:3001/ | grep -iE 'x-|strict-transport|referrer|permissions'
```

Răspunsuri așteptate: toate paginile `HTTP 200`, `/admin` → `302`, POST-uri returnează `{ok:true, id:"..."}`, `/api/admin/stats` fără cookie → `401`, headerele de securitate prezente (`x-frame-options`, `referrer-policy`, `strict-transport-security`, `permissions-policy`).

### 5.3 Flux de dezvoltare zilnic

1. `pnpm --filter @kostech/web dev` → editezi în `apps/web/app/`.
2. HMR pentru `.vue` / `.ts` / `.css`. Pentru `nuxt.config.ts` → restart automat.
3. Înainte de commit: `pnpm --filter @kostech/web typecheck && pnpm --filter @kostech/web build`.
4. Endpoint-urile API se reîncarcă automat la modificarea fișierelor din `server/`.

## 6. Testare E2E (Playwright)

```bash
cd apps/web
pnpm exec playwright install chromium       # one-time, ~150 MB
pnpm test:e2e                               # rulează cele 6 smoke tests
pnpm test:e2e --ui                          # mod interactiv
```

Configurat în `playwright.config.ts` să pornească automat `nuxt dev` pe portul 3001.

## 7. Regenerare OG-images

```bash
pnpm --filter @kostech/web og:generate
```

- Descarcă Inter v4.0 zip o singură dată, cache în `node_modules/.cache/og-fonts/`.
- Extrage `Inter-Bold.ttf` static din zip (Satori NU acceptă variable fonts).
- Generează 8 PNG-uri 1200×630 cu gradient violet `#635BFF → #4F46E5` în `public/og/`.

Dacă rezultatul este corupt: `rm -rf apps/web/node_modules/.cache/og-fonts && pnpm og:generate`.

## 8. Lighthouse local

```bash
cd apps/web
pnpm build
npx @lhci/cli@0.14.x autorun --config=lighthouserc.cjs
```

Asserții configurate: Performance ≥ 0.90, A11y ≥ 0.95, BP ≥ 0.90, SEO ≥ 0.95.

## 9. Debug — probleme frecvente

| Simptom | Fix |
| --- | --- |
| `Cannot find module '~/...'` | `pnpm --filter @kostech/web exec nuxt prepare` |
| `wrangler dev` crash (workerd) | Folosește `pnpm dev` (Nitro Node + fallback Map) |
| OG-gen `Unsupported OpenType signature` | `rm -rf apps/web/node_modules/.cache/og-fonts && pnpm og:generate` |
| Build warning unhead peer | Confirmă că `@nuxtjs/seo` NU e instalat (folosim sitemap + robots direct) |
| Admin login respins cu `dev-admin-token` | Verifică `NUXT_ADMIN_TOKEN` în `.env` (case-sensitive) |
| Stilurile nu se aplică | `app/assets/css/tailwind.css` importat în `nuxt.config.ts` la `css: [...]` |
| `Failed to resolve component: AppHeader / BentoCard` | Nuxt prefixează componentele după folder (`LayoutAppHeader`, `UiBentoCard`). Fix: în `nuxt.config.ts` adaugă `components: [{ path: '~/components', pathPrefix: false }]` |
| `/robots.txt` returnează `Disallow: /` în dev | Comportament intenționat al `@nuxtjs/robots` în dev. În producție respectă config-ul real (`disallow: ['/admin']`). Pentru a forța preview prod: `curl 'http://127.0.0.1:3001/robots.txt?mockProductionEnv'` |
