# Kostech Web

> **Modern IT services website** — Nuxt 4 + Tailwind CSS v4 + Cloudflare Pages
>
> Romanian IT service provider: PC maintenance, server administration, network design, IT security. Multi-language (RO/RU/EN), dark mode, admin panel, Telegram notifications.

---

## 🚀 Quick Start

```bash
git clone <repo-url> kostech
cd kostech
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm --filter @kostech/web dev        # → http://127.0.0.1:3001
```

| Prerequisite | Minimum | Check |
|-------------|---------|-------|
| Node.js | 20.19 (rec. 22 LTS) | `node -v` |
| pnpm | 9.15.9 | `pnpm -v` or `corepack enable` |
| git | 2.30+ | `git --version` |

> ⚠️ On Linux with **glibc < 2.35** (Rocky 9, CentOS Stream 9), `wrangler dev` does NOT work. Use `pnpm dev` instead — KV falls back to in-memory `Map` automatically. Build for Cloudflare works fine regardless.

---

## 🧱 Tech Stack

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Framework | **Nuxt** | 4.4.6 | SSR + prerender + Nitro server |
| UI Runtime | **Vue 3** | 3.5.x | Reactive components |
| Language | **TypeScript strict** | 5.7+ | End-to-end typing |
| Styling | **Tailwind CSS v4** | 4.x | Utility-first via `@tailwindcss/vite` |
| Icons | **@nuxt/icon** (Iconify) | 1.10+ | fa6-solid/regular/brands, lucide |
| Images | **@nuxt/image** | 1.8+ | AVIF/WebP + lazy loading |
| Theme | **@nuxtjs/color-mode** | 3.5+ | Class-based dark mode (`.dark`) |
| SEO | **@nuxtjs/sitemap** + **@nuxtjs/robots** | 7.4 / 5.5 | Auto sitemap.xml + robots.txt |
| Validation | **Zod** | 3.23+ | API request body schemas |
| OG Images | **Satori** + **resvg-js** + **fflate** | 0.12 / 2.6 | 1200×630 PNGs at build time |
| E2E | **Playwright** | 1.49+ | 6 smoke tests |
| Server Runtime | **Nitro** → `cloudflare_pages` preset | (via Nuxt) | Workers + Pages Functions |
| Storage (prod) | **Cloudflare KV** (`CACHE`) | — | Leads & bookings |
| Storage (dev) | **In-memory `Map`** | — | Auto fallback, no binding needed |
| Package Manager | **pnpm workspaces** | 9.15.9 | Monorepo |
| Notifications | **Telegram Bot API** | — | Optional: admin alerts via bot |

> ⚠️ `@nuxtjs/seo` is NOT used — peer-dep incompatible with Nuxt 4 (`unhead@2`). Equivalent achieved via `sitemap` + `robots` + native `useSeoMeta`.

---

## 📁 Project Structure

```
opt/tech2
├── apps/web/                           # Nuxt application
│   ├── app/                            # Nuxt 4 app directory
│   │   ├── app.vue
│   │   ├── assets/css/tailwind.css     # @theme, dark variant, bento masonry
│   │   ├── components/
│   │   │   ├── layout/                 # AppHeader, AppFooter, ThemeToggle
│   │   │   └── ui/                     # BentoCard, BentoGrid, UiButton, UiInput, UiTextarea, UiBadge
│   │   ├── content/services.ts         # 4 services with FAQ data
│   │   ├── layouts/                    # default.vue, admin.vue
│   │   ├── middleware/admin.global.ts  # Admin route guard
│   │   └── pages/
│   │       ├── index.vue               # Bento home (6 cards)
│   │       ├── contact.vue
│   │       ├── booking.vue             # 4-step wizard
│   │       ├── servicii/               # index.vue, [slug].vue
│   │       └── admin/                  # login, index (dashboard), leads, bookings
│   ├── server/
│   │   ├── api/
│   │   │   ├── contact.post.ts
│   │   │   ├── bookings.post.ts
│   │   │   ├── __sitemap__/urls.ts
│   │   │   └── admin/                  # login, stats, leads CRUD, bookings CRUD, content, notifications
│   │   ├── middleware/security.ts      # HSTS, XFO, Referrer, Permissions-Policy
│   │   └── utils/                      # auth, storage, validation, homepage-defaults, services-defaults, settings, telegram, notifications
│   ├── public/                         # fonts (Inter), og/*.png, favicon.svg, robots.txt
│   ├── scripts/                        # copy-fonts.mjs, generate-og.mjs
│   ├── tests/e2e/smoke.spec.ts
│   ├── nuxt.config.ts
│   ├── wrangler.toml
│   ├── playwright.config.ts
│   ├── lighthouserc.cjs
│   └── package.json
├── docs/                               # Extended documentation
│   ├── architecture.md                 # Full architecture reference
│   ├── install-and-dev.md              # Dev setup & smoke tests
│   └── deploy-cloudflare.md            # Deployment guide
├── .github/workflows/                  # CI: web-ci, web-deploy, web-lighthouse
├── scripts/cf-bootstrap.sh             # Cloudflare provisioning
├── pnpm-workspace.yaml
└── package.json
```

---

## 🌐 Pages & Routing

### Public Pages (prerendered at build)

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/pages/index.vue` | Bento-grid home (6 cards) |
| `/servicii` | `app/pages/servicii/index.vue` | Services list |
| `/servicii/[slug]` | `app/pages/servicii/[slug].vue` | Service detail + FAQ JSON-LD (crawled) |
| `/contact` | `app/pages/contact.vue` | Contact form |
| `/booking` | `app/pages/booking.vue` | 4-step booking wizard |

### Admin Panel (SPA, cookie-guarded)

| Route | File | Description |
|-------|------|-------------|
| `/admin/login` | `app/pages/admin/login.vue` | Token-based login |
| `/admin` | `app/pages/admin/index.vue` | Dashboard (stats) |
| `/admin/leads` | `app/pages/admin/leads.vue` | Lead management |
| `/admin/bookings` | `app/pages/admin/bookings.vue` | Booking management |

### i18n Routing

Strategy: `prefix_except_default` — Romanian is default, Russian and English use path prefix:

- `/servicii` → Romanian (default)
- `/ru/servicii` → Russian
- `/en/servicii` → English

---

## 🔌 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/bookings` | Submit booking |
| `GET` | `/api/__sitemap__/urls` | Sitemap URL feed (consumed by `@nuxtjs/sitemap`) |

### Admin (require `kostech_admin` cookie)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Authenticate with token |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/leads` | List all leads |
| `PATCH` | `/api/admin/leads/:id` | Update lead (status, notes) |
| `DELETE` | `/api/admin/leads/:id` | Delete lead |
| `GET` | `/api/admin/bookings` | List all bookings |
| `PATCH` | `/api/admin/bookings/:id` | Update booking (status, notes) |
| `DELETE` | `/api/admin/bookings/:id` | Delete booking |
| `GET` | `/api/admin/notifications/count` | Unread notification count |
| `GET` | `/api/admin/bookings/:id/attachment/:idx` | Fetch booking attachment (PDF, image) |
| `GET` | `/api/admin/content/homepage` | Get editable homepage content |
| `PUT` | `/api/admin/content/homepage` | Update homepage content |
| `GET` | `/api/admin/content/services` | Get editable services |
| `PUT` | `/api/admin/content/services` | Update services |

---

## 💾 Storage & Data

```
KV namespace "CACHE"
├── lead:<id>         → JSON { name, email, phone, message, createdAt, status }
├── booking:<id>      → JSON { serviceSlug, date, name, phone, ..., createdAt, status }
├── homepage:<locale> → JSON homepage content
├── services:<locale> → JSON services list
├── settings          → JSON admin settings
├── notifications:<user-id> → JSON notification queue
├── bookings:<id>:attachments → binary blobs
└── leads:<id>:attachments    → binary blobs
```

- **IDs** are generated as `prefix_timestampBase36_random` in `server/utils/storage.ts`
- **Dev (no wrangler)**: In-memory `Map<string,string>` — data is lost on restart (intentional)
- **Prod**: Cloudflare KV binding `CACHE` from `wrangler.toml` or dashboard
- **Local file fallback**: `.data/kv/` directory when using filesystem driver

---

## 🔐 Authentication (v1 — simple token)

```
                 POST /api/admin/login {token}
User ─────────────────────────────────────────────→ Server
      ←───── cookie: kostech_admin (httpOnly, 7d) ────
```

1. `/admin/login` sends `{token}` to `POST /api/admin/login`
2. Server compares with `process.env.NUXT_ADMIN_TOKEN`, sets `kostech_admin` cookie (`httpOnly`, `sameSite=lax`, `secure` in prod, 7 days)
3. `app/middleware/admin.global.ts` checks the cookie on every navigation to `/admin/*`
4. `server/utils/auth.ts` → `requireAdmin(event)` in protected handlers

**Upgrade path**: Replace with Better Auth + D1 + Drizzle — only `server/utils/auth.ts` + `users` table changes.

---

## 🎨 Styling & Theme

Single source of truth: `app/assets/css/tailwind.css`

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@theme {
  --color-primary: #635BFF;
  --color-dark-bg: #13111C;
  --radius-bento: 2rem;
  --font-sans: "Inter Variable", ...;
}
```

- **Toggle**: `@nuxtjs/color-mode` (cookie `kostech-theme`, class suffix `''`)
- **No-flash**: Inline script in `app.head` sets `.dark` before paint
- **Bento grid**: CSS columns masonry — `column-count: 1; md:2; lg:3`

---

## 🔍 SEO

| Feature | Implementation |
|---------|---------------|
| Meta tags | `useSeoMeta({ title, description, ogImage, twitterImage, ... })` per page |
| OG images | 8 static 1200×630 PNGs in `public/og/*.png` (generated via `pnpm og:generate`) |
| Structured data | `Service` + `FAQPage` JSON-LD on `/servicii/[slug]` via reactive `useHead` |
| Sitemap | Auto-generated from `/api/__sitemap__/urls` endpoint (reads services list) |
| Robots | `disallow: ['/admin']`, everything else allowed |
| Canonical URLs | Set via `NUXT_PUBLIC_SITE_URL` |

---

## ⚡ Performance Targets

- **Prerendering**: Home, servicii, contact, booking, admin/login at build time (`crawlLinks: true`)
- **Images**: `@nuxt/image` — AVIF/WebP format, lazy loading below fold
- **Fonts**: Inter Variable self-hosted, preloaded, `font-display: swap`
- **Bundle**: Current `dist/_worker.js` ≈ 864 kB gzip
- **Lighthouse targets**: Performance ≥ 0.90, Accessibility ≥ 0.95, Best Practices ≥ 0.90, SEO ≥ 0.95

---

## 🛡️ Security

`server/middleware/security.ts` sets:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restrictive (camera, mic, geolocation denied) |
| `Strict-Transport-Security` | Enabled in production (HSTS) |

Plus: Zod `safeParse` on ALL POST/PATCH endpoints, admin cookie `httpOnly`, `/admin` excluded from sitemap.

---

## 🔔 Notifications & Telegram

### In-App Notifications

- **Bell icon with badge** in admin header — polls `GET /api/admin/notifications/count` every 20 seconds
- **In-house toasts** for new events while logged in
- **Notification settings page** (`/admin/notifications`) — per-event toggles

### Telegram Bot (optional)

1. Create bot via `@BotFather` → get token
2. Get chat ID: `curl "https://api.telegram.org/bot<TOKEN>/getUpdates"`
3. In admin `/admin/telegram`: paste token + chat ID, toggle *Activează*, save, test

Settings stored in KV under `settings:admin` (single JSON blob). Token is **write-only** — `GET /api/admin/settings` returns only `****<last 4 chars>`.

| Event | Trigger |
|-------|---------|
| New lead | `POST /api/contact` |
| New booking | `POST /api/bookings` |
| Lead status change | `PATCH /api/admin/leads/:id` |
| Booking status change | `PATCH /api/admin/bookings/:id` |

**Reliability**: Telegram failure is silent (`[notify] telegram failed …` in server console), public POST responds normally with `200 {ok:true}`. Timeout: 4s per request.

---

## ⚙️ Environment Variables

| Variable | Required | Dev Default | Notes |
|----------|:--------:|-------------|-------|
| `NUXT_ADMIN_TOKEN` | Yes (prod) | `dev-admin-token` | Shared secret for `/admin/login` |
| `NUXT_PUBLIC_SITE_URL` | No | `https://kostech.md` | Canonical URL, OG images, sitemap |
| `NUXT_TURNSTILE_SITE_KEY` | No | (empty) | Public Turnstile key (optional) |
| `NUXT_TURNSTILE_SECRET_KEY` | No | (empty) | Secret Turnstile key (server-only) |
| `TELEGRAM_BOT_TOKEN` | No | (empty) | Not needed — set via admin UI instead |
| `TELEGRAM_CHAT_ID` | No | (empty) | Not needed — set via admin UI instead |

```bash
cp apps/web/.env.example apps/web/.env
```

---

## 🛠️ Development Commands

```bash
# Dev server → http://127.0.0.1:3001
pnpm --filter @kostech/web dev

# Full build → apps/web/dist/
pnpm --filter @kostech/web build

# Preview built site (Node)
pnpm --filter @kostech/web preview

# TypeScript strict type-check
pnpm --filter @kostech/web typecheck

# Generate 8 OG images (1200×630) → public/og/
pnpm --filter @kostech/web og:generate

# E2E smoke tests (requires `playwright install chromium`)
pnpm --filter @kostech/web test:e2e

# Interactive E2E runner
pnpm --filter @kostech/web test:e2e --ui

# Lighthouse audit (build first)
cd apps/web && pnpm build && npx @lhci/cli autorun --config=lighthouserc.cjs
```

### Daily Workflow

1. `pnpm --filter @kostech/web dev` — edit in `apps/web/app/`
2. HMR for `.vue` / `.ts` / `.css`. `nuxt.config.ts` changes → auto restart
3. Before commit: `pnpm typecheck && pnpm build`
4. API endpoints reload automatically on `server/` file changes

---

## 🧪 Quick Smoke Test (curl, no browser)

```bash
# Start dev server first, then:

# Public pages (all should return 200)
for p in / /servicii /servicii/mentenanta-pc /servicii/administrare-servere \
         /servicii/proiectare-retele /servicii/securitate-it \
         /contact /booking /sitemap.xml /robots.txt /admin/login; do
  printf "%-40s " "$p"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" "http://127.0.0.1:3001${p}"
done

# Admin redirect (302 → /admin/login)
curl -s -o /dev/null -w "/admin → HTTP %{http_code}\n" --max-redirs 0 http://127.0.0.1:3001/admin

# Contact form POST
curl -s -X POST http://127.0.0.1:3001/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Ion","email":"ion@example.com","phone":"+37360000000","message":"Test mesaj minim 10 caractere."}'

# Admin auth flow
curl -s -X POST http://127.0.0.1:3001/api/admin/login \
  -H 'content-type: application/json' \
  -d '{"token":"dev-admin-token"}' -c /tmp/cookie.txt
curl -s http://127.0.0.1:3001/api/admin/stats -b /tmp/cookie.txt

# Negative: no auth → 401
curl -s -o /dev/null -w "stats no-auth → HTTP %{http_code}\n" \
  http://127.0.0.1:3001/api/admin/stats

# Security headers
curl -sI http://127.0.0.1:3001/ | grep -iE 'x-|strict-transport|referrer|permissions'
```

Expected: all pages `HTTP 200`, `/admin` → `302`, POSTs return `{ok:true, id:"..."}`, `/api/admin/stats` without cookie → `401`, security headers present.

---

## 🚢 Deployment (Cloudflare Pages)

### One-Time Provisioning

```bash
chmod +x scripts/cf-bootstrap.sh
./scripts/cf-bootstrap.sh
```

Creates Pages project `kostech-web` + KV namespace `kostech_cache`. Then uncomment in `apps/web/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "<ID_from_output>"
```

### Production Secrets

```bash
cd apps/web
npx wrangler pages secret put NUXT_ADMIN_TOKEN --project-name=kostech-web
# Use: openssl rand -hex 32
```

### Deploy

```bash
pnpm --filter @kostech/web build
cd apps/web
npx wrangler pages deploy dist --project-name=kostech-web --branch=main
```

### GitHub Actions (CI/CD)

Workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `web-ci.yml` | PR/push | TypeCheck + Build |
| `web-deploy.yml` | Push to `main` | Build + Deploy to Cloudflare Pages |
| `web-lighthouse.yml` | After deploy | Lighthouse audit |

Required GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, optional `LHCI_GITHUB_APP_TOKEN`.

### Post-Deploy Verification

```bash
curl -I https://kostech.md           # HTTP/2 200 + security headers
curl https://kostech.md/sitemap.xml  # Valid XML with all routes
curl https://kostech.md/robots.txt   # Disallow /admin
```

Manual checklist:
- [ ] Dark/light toggle persists across refresh
- [ ] `/admin` → redirects to `/admin/login`
- [ ] Login with production token works
- [ ] `POST /api/contact` → `{ok:true, id:"lead_..."}`
- [ ] Lead appears in `/admin/leads`
- [ ] Telegram bot test message works (if configured)

### Cloudflare Free Tier Limits

| Resource | Free Limit | Paid Trigger |
|----------|-----------|-------------|
| Pages build minutes | 500/month | $0.005/min |
| Pages requests (assets) | Unlimited | Free |
| Workers requests | 100k/day | $0.30/M (10M included on $5/mo plan) |
| KV reads | 100k/day | $0.50/M |
| KV writes | 1k/day | $5/M |
| Custom domain + SSL | Free | — |

For a marketing site with < 10k visits/day, **Free plan is sufficient**.

---

## 🔧 Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot find module '~/...'` | `pnpm --filter @kostech/web exec nuxt prepare` |
| `wrangler dev` crash (workerd) | Use `pnpm dev` (Nitro Node + fallback Map) |
| OG generation: `Unsupported OpenType signature` | `rm -rf apps/web/node_modules/.cache/og-fonts && pnpm og:generate` |
| Build warning about unhead peer dep | Confirm `@nuxtjs/seo` is NOT installed (use sitemap + robots directly) |
| Admin login rejected with `dev-admin-token` | Check `NUXT_ADMIN_TOKEN` in `.env` (case-sensitive) |
| Styles not applying | Verify `app/assets/css/tailwind.css` is imported in `nuxt.config.ts` → `css: [...]` |
| `Failed to resolve component: AppHeader / BentoCard` | Nuxt prefixes components by folder. Fix: `components: [{ path: '~/components', pathPrefix: false }]` in `nuxt.config.ts` |
| `/robots.txt` returns `Disallow: /` in dev | Intentional `@nuxtjs/robots` dev behavior. In production uses real config. Preview: `curl 'http://127.0.0.1:3001/robots.txt?mockProductionEnv'` |

---

## 📚 Extended Documentation

- [Architecture deep-dive](docs/architecture.md) — full tech stack, conventions, routing tables, storage schema, security headers, SEO strategy
- [Install & Dev guide](docs/install-and-dev.md) — prerequisites, daily workflow, smoke tests, E2E, OG generation, Lighthouse
- [Cloudflare deploy guide](docs/deploy-cloudflare.md) — provisioning, secrets, GitHub Actions, custom domain, rollback, cost estimates

---

## 📄 License

Proprietary — Kostech SRL.
