---
goal: Build modern Kostech web app (Nuxt 4 + TailwindCSS + Cloudflare Pages/Workers) — bento UI, services, booking, admin, SEO, Lighthouse 95+
version: 1.0
date_created: 2026-05-29
last_updated: 2026-05-29
owner: Kostech web team
status: 'Planned'
tags: [feature, architecture, nuxt4, cloudflare, tailwind, seo]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan describes the deterministic, end-to-end implementation of a new production-grade Kostech marketing + booking web application based on the existing `index.html` bento mockup, built on **Nuxt 4**, **TailwindCSS v4**, **TypeScript (strict)**, and deployed to **Cloudflare Pages + Workers** with **D1 / KV / R2** bindings. It augments the existing monorepo (`apps/api`, `apps/site`, `apps/admin`, `packages/shared`) with a new `apps/web` Nuxt 4 application that owns the public website, services pages, booking flow, contact form, and a simple admin dashboard for leads. Targets: mobile-first, Lighthouse ≥ 95 across Performance/Accessibility/Best-Practices/SEO, full dark/light mode, premium Stripe/Linear-style visual language.

## 1. Requirements & Constraints

- **REQ-001**: Framework — Nuxt 4 (latest stable, `nuxt@^4`), TypeScript strict, `compatibilityVersion: 4`.
- **REQ-002**: Styling — TailwindCSS v4 via `@tailwindcss/vite`; design tokens mirror existing `index.html` (primary `#635BFF`, `light_bg #F8F9FA`, `dark_bg #13111C`, `dark_card #1C1A27`, `dark_border #2C283B`, `dark_hover #252233`).
- **REQ-003**: Icons — `@nuxt/icon` with Iconify collections `fa6-solid`, `fa6-regular`, `fa6-brands`, `lucide`.
- **REQ-004**: Theme — class-based dark mode with `@vueuse/core` `useColorMode`, persisted in `localStorage` key `kostech-theme`, no flash on load (inline script in `app.head`).
- **REQ-005**: Pages — `/` (home bento), `/servicii` (services list), `/servicii/[slug]` (service detail), `/booking` (booking flow), `/contact` (contact form), `/admin` (dashboard), `/admin/leads`, `/admin/login`.
- **REQ-006**: Booking — multi-step (service → date → contact → confirm) persisted via `POST /api/bookings`, validated with Zod.
- **REQ-007**: Contact — `POST /api/contact` with Zod validation + Cloudflare Turnstile.
- **REQ-008**: Admin — Better Auth session check; lists leads + bookings; allows status update (`new|in_progress|done|canceled`).
- **REQ-009**: SEO — per-route `useSeoMeta`, OG image 1200×630 (`/og/*.png`), JSON-LD (Organization, LocalBusiness, Service, FAQPage, BreadcrumbList), `sitemap.xml`, `robots.txt`, canonical URLs.
- **REQ-010**: i18n — `@nuxtjs/i18n` v9, locales `ro` (default, no prefix), `ru`, `en`; `strategy: 'prefix_except_default'`.
- **REQ-011**: Performance — Lighthouse Mobile ≥ 95 on `/`, `/servicii`, `/contact`. CWV: LCP < 2.0s, CLS < 0.05, INP < 200ms.
- **SEC-001**: All form endpoints require Turnstile token verification server-side.
- **SEC-002**: Admin routes guarded by Better Auth session middleware + RBAC `hasPermission('lead:read')` from `@kostech/shared`.
- **SEC-003**: Security headers via Nitro middleware: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **SEC-004**: All env secrets (`BETTER_AUTH_SECRET`, `TURNSTILE_SECRET`, `RESEND_API_KEY`) injected via `wrangler secret`, never committed.
- **CON-001**: Must coexist with existing `apps/api`, `apps/site`, `apps/admin` — new app lives in `apps/web`, does NOT modify other apps' source.
- **CON-002**: Local dev cannot use `wrangler dev` (glibc < 2.35) — must use Nuxt dev server with `nitro-cloudflare-dev` shim for D1/KV/R2.
- **CON-003**: Drizzle remains pinned at `0.45.2`; reuse `apps/api/src/db/schema.ts` via `@kostech/shared` re-export if needed.
- **CON-004**: pnpm workspace — new app declared in root `pnpm-workspace.yaml` as `apps/web`.
- **GUD-001**: Mobile-first Tailwind utilities; minimum touch target 44×44 px.
- **GUD-002**: Default to static components; use `<ClientOnly>` and `definePageMeta({ ssr: true })` deliberately.
- **GUD-003**: All images via `<NuxtImg>` (`@nuxt/image` with `cloudflare` provider); WebP/AVIF; explicit `width`/`height`; `loading="lazy"` except LCP (`loading="eager" fetchpriority="high"`).
- **GUD-004**: One self-hosted font: Inter variable (`@fontsource-variable/inter`), preloaded woff2, `font-display: swap`.
- **PAT-001**: Folder structure follows Nuxt 4 `app/` convention (`app/components`, `app/pages`, `app/layouts`, `app/composables`, `app/middleware`, `app/assets`, `server/api`, `server/middleware`, `server/utils`).
- **PAT-002**: Components grouped: `ui/` (primitives), `layout/` (Header, Footer, ThemeToggle), `bento/` (cards), `forms/` (BookingForm, ContactForm), `seo/` (JsonLd).
- **PAT-003**: Composables prefix `use*`; server utils in `server/utils/*`.

## 2. Implementation Steps

### Implementation Phase 1 — Scaffolding & workspace wiring

- GOAL-001: Create `apps/web` Nuxt 4 app integrated into the pnpm workspace with TypeScript strict, Tailwind v4, Cloudflare preset.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-001 | Add `"apps/web"` to `/opt/tech2/pnpm-workspace.yaml` `packages:` list. | | |
| TASK-002 | Create `apps/web/package.json` with name `@kostech/web`, scripts `dev` (`nuxt dev --port 3001`), `build` (`nuxt build`), `preview` (`nuxt preview`), `typecheck` (`nuxt typecheck`), `deploy` (`wrangler pages deploy dist`). | | |
| TASK-003 | Install deps: `nuxt@^4`, `vue@^3.5`, `typescript@^5.6`, `@nuxtjs/tailwindcss` replaced by `@tailwindcss/vite@^4`, `tailwindcss@^4`, `@nuxt/icon`, `@nuxt/image`, `@nuxtjs/i18n@^9`, `@nuxtjs/seo`, `@vueuse/core`, `@vueuse/nuxt`, `nitro-cloudflare-dev`, `zod`, `@fontsource-variable/inter`. | | |
| TASK-004 | Create `apps/web/nuxt.config.ts` with `compatibilityVersion: 4`, `nitro.preset: 'cloudflare-pages'`, `modules: ['@nuxt/icon','@nuxt/image','@nuxtjs/i18n','@nuxtjs/seo','@vueuse/nuxt','nitro-cloudflare-dev']`, `vite.plugins: [tailwindcss()]`, `app.head` with viewport + preload Inter woff2 + theme no-flash inline script. | | |
| TASK-005 | Create `apps/web/tsconfig.json` extending `./.nuxt/tsconfig.json` with `compilerOptions.strict: true`, path alias `@kostech/shared` → `../../packages/shared/src`. | | |
| TASK-006 | Create `apps/web/app/assets/css/tailwind.css` importing `@import "tailwindcss";` and `@theme` block with all design tokens (REQ-002 colors, `--font-sans: 'Inter Variable'`, radius scale, shadow tokens `--shadow-card`, `--shadow-dark-card`). | | |
| TASK-007 | Create `apps/web/wrangler.toml` with `name = "kostech-web"`, `pages_build_output_dir = "dist"`, bindings stubs for `DB` (D1), `CACHE` (KV), `MEDIA` (R2), and `[vars] SITE_URL = "https://kostech.md"`. | | |
| TASK-008 | Create `apps/web/server/tsconfig.json` and `apps/web/.gitignore` (`.nuxt`, `.output`, `dist`, `.wrangler`, `node_modules`). | | |

### Implementation Phase 2 — Design system & layout primitives

- GOAL-002: Implement reusable UI primitives, layout, theme toggle, and bento grid matching `index.html`.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-009 | Create `app/composables/useTheme.ts` wrapping `useColorMode({ storageKey: 'kostech-theme', classSuffix: '' })` exposing `toggle()` and `isDark`. | | |
| TASK-010 | Create `app/components/layout/ThemeToggle.vue` — round 40px button, `<Icon name="fa6-solid:moon"/>` / `fa6-solid:sun`, calls `useTheme().toggle()`. | | |
| TASK-011 | Create `app/components/layout/AppHeader.vue` replicating `index.html` navbar (logo `fa6-solid:microchip`, centered phone CTA `+373 78 643 740`, social icons, theme toggle, copyright row). | | |
| TASK-012 | Create `app/components/layout/AppFooter.vue` with bento-card style, columns: brand, services links, contact, social, legal. | | |
| TASK-013 | Create `app/layouts/default.vue` with `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10`, `<AppHeader/>`, `<slot/>`, `<AppFooter/>`. | | |
| TASK-014 | Create `app/layouts/admin.vue` with sidebar nav + admin top bar. | | |
| TASK-015 | Create `app/components/ui/BentoGrid.vue` (CSS `column-count` masonry as per `index.html`) and `BentoCard.vue` (rounded `2rem`, shadow-card variants, dark border). | | |
| TASK-016 | Create `app/components/ui/UiButton.vue` (variants `primary|ghost|outline`, sizes `sm|md|lg`, min 44px height). | | |
| TASK-017 | Create `app/components/ui/UiInput.vue`, `UiTextarea.vue`, `UiSelect.vue`, `UiBadge.vue` styled to match form block in `index.html`. | | |
| TASK-018 | Create `app/components/ui/Section.vue` for spaced bento sections with optional eyebrow heading. | | |

### Implementation Phase 3 — Pages & content

- GOAL-003: Implement public pages (home, services, service detail, booking, contact) with SSR/SSG and i18n.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-019 | Create `app/pages/index.vue` rendering `BentoGrid` with cards: ProfileHero, OrderForm (shortcut to /booking), ServicesPreview, LocationMap — port markup from `index.html`. | | |
| TASK-020 | Create `app/content/services.ts` exporting typed `Service[]` (slug, title, summary, priceFrom, icon, features[], faqs[]) — 4 entries: `mentenanta-pc`, `administrare-servere`, `proiectare-retele`, `securitate-it`. | | |
| TASK-021 | Create `app/pages/servicii/index.vue` listing services as bento cards (link to `/servicii/[slug]`). | | |
| TASK-022 | Create `app/pages/servicii/[slug].vue` with `useAsyncData` resolving from `services.ts`, sections: hero, features, pricing CTA, FAQ accordion, related services. Emit FAQPage JSON-LD via `<JsonLd>`. | | |
| TASK-023 | Create `app/pages/booking.vue` — 4-step wizard component (`BookingForm.vue`) using `useState('booking', ...)`: step1 service, step2 date (next 14 days), step3 contact (name, phone, email, address), step4 confirm. Submits to `POST /api/bookings`. | | |
| TASK-024 | Create `app/pages/contact.vue` with `ContactForm.vue` (name, email, phone, message, Turnstile widget) → `POST /api/contact`; sidebar bento card with phone, telegram, map. | | |
| TASK-025 | Create `app/pages/admin/login.vue` — email+password form → `POST /api/auth/sign-in/email` (Better Auth). | | |
| TASK-026 | Create `app/pages/admin/index.vue` dashboard — counters (leads today/week, bookings pending) via `useFetch('/api/admin/stats')`. | | |
| TASK-027 | Create `app/pages/admin/leads.vue` and `app/pages/admin/bookings.vue` — data tables with status select, calling `PATCH /api/admin/leads/:id` and `/api/admin/bookings/:id`. | | |
| TASK-028 | Create `app/middleware/admin.global.ts` redirecting to `/admin/login` if no session on `/admin/**` (except `/admin/login`). | | |

### Implementation Phase 4 — Server API (Nitro on Workers)

- GOAL-004: Implement Nitro server routes for contact, booking, admin, and security middleware.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-029 | Create `server/utils/db.ts` — `useDb(event)` returning Drizzle client bound to `event.context.cloudflare.env.DB`. | | |
| TASK-030 | Create `server/utils/schema.ts` re-exporting Drizzle tables `leads`, `bookings` (new: id text pk, service_slug text, scheduled_at integer, name text, phone text, email text, address text, status text default 'new', created_at integer). Generate migration in `apps/web/server/db/migrations/0001_init.sql`. | | |
| TASK-031 | Create `server/utils/turnstile.ts` — `verifyTurnstile(token, ip, secret)` POSTing to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. | | |
| TASK-032 | Create `server/utils/validation.ts` exporting Zod schemas `ContactSchema`, `BookingSchema`. | | |
| TASK-033 | Create `server/api/contact.post.ts` — parse with `ContactSchema.safeParse`, verify Turnstile, insert into `leads`, return `{ ok: true, id }`. | | |
| TASK-034 | Create `server/api/bookings.post.ts` — same pattern, insert into `bookings`. | | |
| TASK-035 | Create `server/api/admin/stats.get.ts` returning counts (guard with `requireAdmin(event)`). | | |
| TASK-036 | Create `server/api/admin/leads/index.get.ts`, `[id].patch.ts`, `[id].delete.ts`. | | |
| TASK-037 | Create `server/api/admin/bookings/index.get.ts`, `[id].patch.ts`. | | |
| TASK-038 | Create `server/utils/auth.ts` — `getSession(event)` using Better Auth + drizzleAdapter against `DB`; `requireAdmin(event)` throws 401/403. | | |
| TASK-039 | Create `server/middleware/security.ts` setting CSP, HSTS, X-CTO, Referrer-Policy, Permissions-Policy on every response. | | |
| TASK-040 | Create `server/middleware/cache.ts` setting `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` for GET HTML routes `/`, `/servicii*`. | | |

### Implementation Phase 5 — SEO, i18n, assets

- GOAL-005: Full SEO surface (meta, OG, JSON-LD, sitemap, robots), i18n setup, fonts and images.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-041 | Configure `@nuxtjs/seo` in `nuxt.config.ts` with `site: { url: 'https://kostech.md', name: 'Kostech', defaultLocale: 'ro' }`. | | |
| TASK-042 | Configure `@nuxtjs/i18n` with `locales: [{code:'ro',iso:'ro-MD',file:'ro.json'},{code:'ru',iso:'ru-RU',file:'ru.json'},{code:'en',iso:'en-US',file:'en.json'}]`, `defaultLocale:'ro'`, `strategy:'prefix_except_default'`, `langDir:'locales'`. | | |
| TASK-043 | Create `app/i18n/locales/ro.json`, `ru.json`, `en.json` with keys for nav, hero, services, forms, footer, seo titles/descriptions. | | |
| TASK-044 | Add per-page `useSeoMeta({ title, description, ogImage, ogType:'website', twitterCard:'summary_large_image' })` in every `app/pages/**`. | | |
| TASK-045 | Create `app/components/seo/JsonLd.vue` (`<script type="application/ld+json" v-html=...>`) and emit Organization+LocalBusiness on `default.vue`, Service on `[slug].vue`, FAQPage on detail/faq sections, BreadcrumbList on inner pages. | | |
| TASK-046 | Generate OG images 1200×630 PNG under `public/og/{index,servicii,contact,booking}.png` and `public/og/servicii/{slug}.png` per service. | | |
| TASK-047 | Add `public/robots.txt` (allow all, sitemap URL) — auto via `@nuxtjs/seo`; confirm output. | | |
| TASK-048 | Verify `@nuxtjs/sitemap` generates `/sitemap.xml` with i18n alternates and proper priorities (home 1.0 weekly, services 0.8 monthly). | | |
| TASK-049 | Add Inter Variable woff2 preload (`<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/inter-variable-latin.woff2">`) and `@font-face` in `tailwind.css` with `font-display: swap` and `unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+0400-04FF` (Cyrillic for ru). | | |
| TASK-050 | Configure `@nuxt/image` with `provider: 'cloudflare'`, `cloudflare.baseURL: 'https://kostech.md'`; replace all `<img>` with `<NuxtImg>` in components. | | |

### Implementation Phase 6 — Deployment, CI, verification

- GOAL-006: Cloudflare Pages deployment, CI workflow, Lighthouse + Playwright verification.

| Task     | Description | Completed | Date |
| -------- | ----------- | --------- | ---- |
| TASK-051 | Add `apps/web/scripts/cf-bootstrap.sh` creating D1 (`kostech-web`), KV (`kostech-web-cache`), R2 (`kostech-web-media`); writes IDs back into `wrangler.toml`. | | |
| TASK-052 | Add Drizzle migrations runner: `pnpm --filter @kostech/web db:migrate:remote` → `wrangler d1 migrations apply kostech-web --remote`. | | |
| TASK-053 | Create `.github/workflows/web-ci.yml` — matrix node 20, steps: install (pnpm), typecheck, build, lint, upload artifact. | | |
| TASK-054 | Create `.github/workflows/web-deploy.yml` — on push to `main` paths `apps/web/**`: `pnpm --filter @kostech/web build` then `cloudflare/pages-action@v1` with `directory: apps/web/dist`. | | |
| TASK-055 | Create `.github/workflows/web-lighthouse.yml` — runs `lhci autorun` against preview URL with assertions `performance>=0.95, accessibility>=0.95, best-practices>=0.95, seo>=0.95`. | | |
| TASK-056 | Add `apps/web/lighthouserc.cjs` with budgets per REQ-011 and assertion thresholds. | | |
| TASK-057 | Add Playwright e2e suite `apps/web/tests/e2e/` covering: home loads, theme toggle persists, booking 4-step happy path (mocked Turnstile), contact form happy path, admin login redirect when unauthenticated. | | |
| TASK-058 | Document local dev shim usage in `apps/web/README.md` (Nuxt dev on :3001, `nitro-cloudflare-dev` for D1/KV/R2, glibc note). | | |
| TASK-059 | Run `pnpm --filter @kostech/web typecheck && pnpm --filter @kostech/web build` and capture green output. | | |
| TASK-060 | Run Lighthouse CI locally against `pnpm --filter @kostech/web preview` and confirm all 4 scores ≥ 95 on `/`, `/servicii`, `/contact`. | | |

## 3. Alternatives

- **ALT-001**: Astro + Vue islands instead of Nuxt 4 — rejected: requirement explicitly mandates Nuxt 4, and booking/admin benefit from Nuxt server routes + middleware.
- **ALT-002**: Extend existing `apps/site` (Astro) — rejected: Astro stack differs from required Nuxt 4; mixing would inflate scope and break the existing site.
- **ALT-003**: Deploy via Cloudflare Workers `nitro.preset: 'cloudflare-module'` directly — viable but Pages preset gives simpler asset/cache pipeline and preview deployments; can migrate later without code change.
- **ALT-004**: shadcn-vue for primitives — rejected for v1 to keep bundle minimal; hand-rolled `ui/` components match the bespoke bento mockup precisely. Can be introduced incrementally.
- **ALT-005**: hCaptcha instead of Turnstile — rejected: Cloudflare-native Turnstile is free, lower latency at edge, no third-party DNS.

## 4. Dependencies

- **DEP-001**: `nuxt@^4`, `vue@^3.5`, `typescript@^5.6`
- **DEP-002**: `tailwindcss@^4`, `@tailwindcss/vite@^4`
- **DEP-003**: `@nuxt/icon`, `@nuxt/image`, `@iconify-json/fa6-solid`, `@iconify-json/fa6-regular`, `@iconify-json/fa6-brands`, `@iconify-json/lucide`
- **DEP-004**: `@nuxtjs/i18n@^9`, `@nuxtjs/seo` (includes sitemap, robots, schema-org, og-image)
- **DEP-005**: `@vueuse/core`, `@vueuse/nuxt`
- **DEP-006**: `zod@^3.23`
- **DEP-007**: `drizzle-orm@0.45.2` (pinned per CON-003), `better-sqlite3@^12` (dev only)
- **DEP-008**: `better-auth@^1` + `@better-auth/drizzle-adapter`
- **DEP-009**: `nitro-cloudflare-dev` (local D1/KV/R2 shim)
- **DEP-010**: `@fontsource-variable/inter`
- **DEP-011**: `wrangler@^3` (deploy), `@cloudflare/workers-types`
- **DEP-012**: `@playwright/test`, `@lhci/cli` (CI verification)
- **DEP-013**: External services — Cloudflare account with Pages + D1 + KV + R2 enabled; Turnstile site+secret keys; optional Resend API key for email notifications.

## 5. Files

- **FILE-001**: `/opt/tech2/pnpm-workspace.yaml` — append `apps/web`.
- **FILE-002**: `/opt/tech2/apps/web/package.json` — scripts + deps.
- **FILE-003**: `/opt/tech2/apps/web/nuxt.config.ts` — modules, Cloudflare preset, head.
- **FILE-004**: `/opt/tech2/apps/web/tsconfig.json` — strict TS, path aliases.
- **FILE-005**: `/opt/tech2/apps/web/wrangler.toml` — bindings (DB, CACHE, MEDIA), vars.
- **FILE-006**: `/opt/tech2/apps/web/app/assets/css/tailwind.css` — `@theme` tokens, font-face.
- **FILE-007**: `/opt/tech2/apps/web/app/layouts/{default,admin}.vue`.
- **FILE-008**: `/opt/tech2/apps/web/app/components/layout/{AppHeader,AppFooter,ThemeToggle}.vue`.
- **FILE-009**: `/opt/tech2/apps/web/app/components/ui/{BentoGrid,BentoCard,UiButton,UiInput,UiTextarea,UiSelect,UiBadge,Section}.vue`.
- **FILE-010**: `/opt/tech2/apps/web/app/components/bento/{ProfileHero,ServicesPreview,LocationMap,OrderForm}.vue`.
- **FILE-011**: `/opt/tech2/apps/web/app/components/forms/{BookingForm,ContactForm}.vue`.
- **FILE-012**: `/opt/tech2/apps/web/app/components/seo/JsonLd.vue`.
- **FILE-013**: `/opt/tech2/apps/web/app/pages/{index,contact,booking}.vue`, `servicii/{index,[slug]}.vue`, `admin/{login,index,leads,bookings}.vue`.
- **FILE-014**: `/opt/tech2/apps/web/app/composables/{useTheme,useBooking,useAdmin}.ts`.
- **FILE-015**: `/opt/tech2/apps/web/app/middleware/admin.global.ts`.
- **FILE-016**: `/opt/tech2/apps/web/app/content/services.ts`.
- **FILE-017**: `/opt/tech2/apps/web/app/i18n/locales/{ro,ru,en}.json`.
- **FILE-018**: `/opt/tech2/apps/web/server/api/contact.post.ts`, `bookings.post.ts`, `admin/stats.get.ts`, `admin/leads/[index.get,[id].patch,[id].delete].ts`, `admin/bookings/[index.get,[id].patch].ts`.
- **FILE-019**: `/opt/tech2/apps/web/server/middleware/{security,cache}.ts`.
- **FILE-020**: `/opt/tech2/apps/web/server/utils/{db,schema,turnstile,validation,auth}.ts`.
- **FILE-021**: `/opt/tech2/apps/web/server/db/migrations/0001_init.sql`.
- **FILE-022**: `/opt/tech2/apps/web/public/{robots.txt,favicon.svg,fonts/inter-variable-latin.woff2,og/*.png}`.
- **FILE-023**: `/opt/tech2/apps/web/scripts/cf-bootstrap.sh`.
- **FILE-024**: `/opt/tech2/apps/web/lighthouserc.cjs`.
- **FILE-025**: `/opt/tech2/apps/web/tests/e2e/{home,theme,booking,contact,admin-guard}.spec.ts`.
- **FILE-026**: `/opt/tech2/.github/workflows/{web-ci,web-deploy,web-lighthouse}.yml`.
- **FILE-027**: `/opt/tech2/apps/web/README.md`.

## 6. Testing

- **TEST-001**: `pnpm --filter @kostech/web typecheck` — must exit 0.
- **TEST-002**: `pnpm --filter @kostech/web build` — must produce `apps/web/dist/` with `_worker.js` and `_routes.json`.
- **TEST-003**: Playwright `home.spec.ts` — `/` renders header, bento grid, footer; theme toggle adds/removes `.dark` on `<html>` and persists in localStorage.
- **TEST-004**: Playwright `booking.spec.ts` — completes 4 steps with Turnstile stubbed via `--mock-turnstile`, asserts POST `/api/bookings` returns 200 + DB row inserted.
- **TEST-005**: Playwright `contact.spec.ts` — submits form, asserts success toast + `/api/contact` 200.
- **TEST-006**: Playwright `admin-guard.spec.ts` — unauthenticated GET `/admin` redirects to `/admin/login`; after sign-in, redirects back.
- **TEST-007**: Vitest unit `server/utils/validation.test.ts` — `ContactSchema` and `BookingSchema` reject invalid payloads (missing fields, bad email, past date).
- **TEST-008**: Vitest unit `server/utils/turnstile.test.ts` — mocks fetch, asserts request shape and `success:false` rejection.
- **TEST-009**: Lighthouse CI — `/`, `/servicii`, `/servicii/mentenanta-pc`, `/contact`, `/booking` all ≥ 95 for performance/a11y/best-practices/seo.
- **TEST-010**: Axe a11y scan in Playwright on all public pages — zero serious/critical violations.
- **TEST-011**: Validate JSON-LD via `https://validator.schema.org/` (manual gate) for Organization, Service, FAQPage.
- **TEST-012**: Sitemap fetch `GET /sitemap.xml` returns 200 with all routes and i18n alternates.

## 7. Risks & Assumptions

- **RISK-001**: Nuxt 4 stable release timing — if any required module (e.g. `@nuxtjs/i18n`) lags, pin to last known-good and re-test on upgrade.
- **RISK-002**: Local dev shim (`nitro-cloudflare-dev`) may not perfectly emulate D1 transactions — mitigate by running smoke tests against a Cloudflare preview deployment before merging.
- **RISK-003**: Turnstile blocking automation tests — mitigate via `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` (Cloudflare always-passes test key) in CI.
- **RISK-004**: CSP too strict may block Iconify inline SVGs or analytics — start with report-only mode for 1 week, then enforce.
- **RISK-005**: Lighthouse 95 SEO score requires meta description ≤ 160 chars, unique titles per page, valid `<html lang>` — covered by REQ-009 but must be QA'd per page.
- **ASSUMPTION-001**: Cloudflare account is provisioned and `wrangler login` is available to the deployer.
- **ASSUMPTION-002**: Domain `kostech.md` (or chosen production domain) is on Cloudflare DNS.
- **ASSUMPTION-003**: Existing `apps/api` Better Auth schema is reusable; if not, `apps/web` ships its own minimal `users`/`sessions` tables.
- **ASSUMPTION-004**: Phone `+373 78 643 740`, location "Chișinău, Moldova", and the four services in `index.html` are the canonical content for v1.
- **ASSUMPTION-005**: Email delivery for lead notifications is optional in v1; can be added via Resend in a follow-up.

## 8. Related Specifications / Further Reading

- [Nuxt 4 documentation](https://nuxt.com/docs/getting-started/introduction)
- [Nuxt on Cloudflare Pages](https://nuxt.com/deploy/cloudflare)
- [TailwindCSS v4 docs](https://tailwindcss.com/docs)
- [@nuxtjs/seo module](https://nuxtseo.com/)
- [Better Auth docs](https://www.better-auth.com/docs)
- [Cloudflare D1 + Drizzle](https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- Existing repo memory: `/memories/repo/kostech-monorepo-v2.md`
- Source mockup: `/opt/tech2/index.html`
