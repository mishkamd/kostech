# Arhitectură — Kostech Web

## 1. Stack tehnologic

| Strat | Tehnologie | Versiune lock | Rol |
| --- | --- | --- | --- |
| Framework | **Nuxt** | `4.4.6` | SSR + prerender + Nitro server |
| UI runtime | **Vue 3** | `3.5.x` | Componente reactive |
| Limbaj | **TypeScript strict** | `5.7+` | Tipare end-to-end |
| Stil | **Tailwind CSS v4** | `4.x` | Utility-first via `@tailwindcss/vite` |
| Iconuri | **`@nuxt/icon`** + Iconify | `1.10+` | fa6-solid/regular/brands, lucide |
| Imagini | **`@nuxt/image`** | `1.8+` | AVIF/WebP + lazy loading |
| Theme | **`@nuxtjs/color-mode`** | `3.5+` | Dark mode prin clasă (`.dark`) |
| SEO | **`@nuxtjs/sitemap`** + **`/robots`** | `7.4` / `5.5` | sitemap.xml + robots.txt automate |
| Validare | **Zod** | `3.23+` | Schema-uri pentru API request body |
| OG-images | **Satori + resvg-js + fflate** | `0.12` / `2.6` | PNG 1200×630 generate la build |
| E2E | **Playwright** | `1.49+` | 6 smoke tests |
| Server runtime | **Nitro → preset `cloudflare_pages`** | (via Nuxt) | Workers + Pages Functions |
| Storage prod | **Cloudflare KV** (`CACHE`) | — | Lead-uri & programări |
| Storage dev | **In-memory `Map`** | — | Fallback automat fără binding |
| Package manager | **pnpm workspaces** | `9.15.9` | |
| Node | **22 LTS** (recomandat), min `20.19` | | |

> ⚠️ `@nuxtjs/seo` NU este folosit — peer-dep incompatibil cu Nuxt 4 (`unhead@2`). Echivalent obținut prin `sitemap` + `robots` + `useSeoMeta` nativ.

## 2. Structură monorepo

```
/opt/tech2
├── apps/web/                        ← aplicația Nuxt
│   ├── app/                         ← Nuxt 4 app directory
│   │   ├── app.vue
│   │   ├── assets/css/tailwind.css  ← @theme, dark variant, bento masonry
│   │   ├── components/
│   │   │   ├── layout/{AppHeader,AppFooter,ThemeToggle}.vue
│   │   │   └── ui/{BentoCard,BentoGrid,UiButton,UiInput,UiTextarea,UiBadge}.vue
│   │   ├── content/services.ts      ← 4 servicii cu FAQ
│   │   ├── layouts/{default,admin}.vue
│   │   ├── middleware/admin.global.ts
│   │   └── pages/
│   │       ├── index.vue            ← home bento 6 carduri
│   │       ├── contact.vue
│   │       ├── booking.vue          ← wizard 4 pași
│   │       ├── servicii/{index,[slug]}.vue
│   │       └── admin/{login,index,leads,bookings}.vue
│   ├── server/
│   │   ├── api/
│   │   │   ├── contact.post.ts
│   │   │   ├── bookings.post.ts
│   │   │   ├── __sitemap__/urls.ts
│   │   │   └── admin/
│   │   │       ├── login.post.ts
│   │   │       ├── stats.get.ts
│   │   │       ├── leads/{index.get,[id].patch}.ts
│   │   │       └── bookings/{index.get,[id].patch}.ts
│   │   ├── middleware/security.ts   ← HSTS, XFO, Referrer, Permissions
│   │   └── utils/{auth,storage,validation}.ts
│   ├── public/{fonts,og,favicon.svg,robots.txt}
│   ├── scripts/{copy-fonts,generate-og}.mjs
│   ├── tests/e2e/smoke.spec.ts
│   ├── nuxt.config.ts
│   ├── wrangler.toml
│   ├── playwright.config.ts
│   ├── lighthouserc.cjs
│   └── package.json
├── .github/workflows/{web-ci,web-deploy,web-lighthouse}.yml
├── scripts/cf-bootstrap.sh
├── pnpm-workspace.yaml
└── package.json
```

## 3. Convenții Nuxt 4

- `compatibilityVersion: 4` în `nuxt.config.ts` → toate fișierele aplicației sub `app/`.
- Alias-uri: `~/...` = `app/...`, `~~/...` = root proiect (ex.: `~~/app/content/...` din `server/`).
- Codul **server-side** rămâne sub `server/` (Nitro), separat de `app/`.

## 4. Rutare

### 4.1 Pagini publice (prerendered)

| Rută | Fișier |
| --- | --- |
| `/` | `app/pages/index.vue` |
| `/servicii` | `app/pages/servicii/index.vue` |
| `/servicii/[slug]` | `app/pages/servicii/[slug].vue` (crawled) |
| `/contact` | `app/pages/contact.vue` |
| `/booking` | `app/pages/booking.vue` |

### 4.2 Admin (SPA, cookie-guard)

| Rută | Fișier |
| --- | --- |
| `/admin/login` | `app/pages/admin/login.vue` |
| `/admin` | `app/pages/admin/index.vue` (dashboard) |
| `/admin/leads` | `app/pages/admin/leads.vue` |
| `/admin/bookings` | `app/pages/admin/bookings.vue` |

### 4.3 API (Nitro pe Workers)

| Endpoint | Auth |
| --- | --- |
| `POST /api/contact`, `POST /api/bookings` | Public |
| `POST /api/admin/login` | Public (token) |
| `GET /api/admin/stats` | Cookie `kostech_admin` |
| `GET/PATCH /api/admin/leads(/...)` | Cookie `kostech_admin` |
| `GET/PATCH /api/admin/bookings(/...)` | Cookie `kostech_admin` |
| `GET /api/__sitemap__/urls` | Public (consumat de `@nuxtjs/sitemap`) |

## 5. Storage & date

```
KV namespace "CACHE"
├── lead:<id>     → JSON { name, email, phone, message, createdAt, status }
└── booking:<id>  → JSON { serviceSlug, date, name, phone, ..., createdAt, status }
```

- `id`: `${prefix}_${ts_base36}${random}` în `server/utils/storage.ts`.
- **Dev fără wrangler** → `Map<string,string>` (datele se pierd la restart, intenționat).
- **Prod** → binding `CACHE` din `wrangler.toml` sau dashboard.

## 6. Autentificare admin (v1 simplu)

1. `/admin/login` trimite `{token}` la `POST /api/admin/login`.
2. Server compară cu `process.env.NUXT_ADMIN_TOKEN`, setează cookie `kostech_admin` (`httpOnly`, `sameSite=lax`, `secure` în prod, 7 zile).
3. `app/middleware/admin.global.ts` verifică cookie-ul la fiecare navigare către `/admin/*`.
4. `server/utils/auth.ts` → `requireAdmin(event)` în handler-ele protejate.

**Upgrade path**: înlocuire cu Better Auth + D1 + Drizzle = doar `server/utils/auth.ts` + tabel `users`.

## 7. Stilizare & temă

Punct unic de adevăr: `app/assets/css/tailwind.css`

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

- Toggle: `@nuxtjs/color-mode` (cookie `kostech-theme`, `classSuffix: ''`).
- **No-flash**: script inline în `app.head` setează `.dark` înainte de paint.
- Bento: `.bento-grid { column-count: 1; md:2; lg:3 }` (CSS columns masonry).

## 8. SEO

- Per pagină: `useSeoMeta({ title, description, ogImage, twitterImage, ... })`.
- OG-images statice 1200×630 în `public/og/*.png` (8 fișiere generate cu `pnpm og:generate`).
- `Service` + `FAQPage` JSON-LD pe `/servicii/[slug]` via `useHead` reactiv.
- `sitemap.xml` din endpoint `/api/__sitemap__/urls.ts` (citește lista de servicii).
- `robots.txt` cu `disallow: ['/admin']`.

## 9. Performance

- Prerender la build: home, servicii, contact, booking, admin/login (Nitro `crawlLinks: true`).
- Imagini: `@nuxt/image` cu format AVIF/WebP, lazy loading sub fold.
- Fonturi: Inter Variable self-hosted, preload + `font-display: swap`.
- Bundle: build curent `dist/_worker.js` ≈ 864 kB gzip.
- Țintă Lighthouse: Performance ≥ 0.90, A11y ≥ 0.95, BP ≥ 0.90, SEO ≥ 0.95.

## 10. Securitate

`server/middleware/security.ts` setează:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiv
- `Strict-Transport-Security` (HSTS) în prod

Plus: Zod `safeParse` pe TOATE POST/PATCH, cookie admin `httpOnly`, `/admin` exclus din sitemap.
