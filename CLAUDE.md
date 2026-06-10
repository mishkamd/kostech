# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@kostech/web** — Nuxt 4 + TailwindCSS v4 + Cloudflare Pages monorepo for a Romanian IT services website.

- **Framework**: Nuxt 4 (strict TypeScript, `compatibilityVersion: 4`)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
- **Icons**: Iconify (fa6-solid/regular/brands, lucide)
- **Backend**: Nitro server on Cloudflare Pages Functions
- **Storage**: Cloudflare KV (binding `CACHE`); in-memory fallback in local dev
- **i18n**: @nuxtjs/i18n — Ro (default) / Ru / En with cookie-based locale
- **Dark Mode**: @nuxtjs/color-mode — class-based toggle (stored in `kostech-theme` cookie)

## Development Commands

```bash
# Install dependencies (root or apps/web — pnpm manages both)
pnpm install

# Dev server on http://127.0.0.1:3001
pnpm dev

# Type-check
pnpm typecheck

# Build for Cloudflare Pages
pnpm build

# Preview built site locally
pnpm --filter @kostech/web preview

# E2E tests (Playwright, runs against preview server)
pnpm --filter @kostech/web test:e2e
```

To test against real Cloudflare bindings: `pnpm wrangler pages dev` after `pnpm build` (requires glibc ≥ 2.35).

## Architecture

### Pages (Nuxt routing under `/apps/web/app/pages/`)
- `/` — Bento-style home (mirrors root `index.html` design)
- `/servicii`, `/servicii/[slug]` — Services list & detail with FAQ JSON-LD
- `/booking` — 4-step wizard; posts to `/api/bookings`
- `/admin/login`, `/admin`, `/admin/leads`, `/admin/bookings` — Admin panel (protected by `NUXT_ADMIN_TOKEN` in login route)

Prerendered routes: `/`, `/servicii`, `/booking` + locale variants (`/ru/...`, `/en/...`).

### Components

- **`/app/components/layout/`** — Header, Footer, AdminNotificationsBell, AppHeader
- **`/app/components/ui/`** — Reusable UI (BentoGrid, forms, modals, etc.)

Auto-registered with `pathPrefix: false`, so import as `<MyComponent />` (no path prefix).

### Server API (Nitro routes under `/server/api/`)

**Public endpoints:**
- `POST /api/contact` — Contact form submission
- `POST /api/bookings` — Booking submission
- `GET /api/content/homepage` — Homepage content (title, hero, etc.)
- `GET /api/content/services` — Services list with metadata
- `GET /api/__sitemap__/urls` — Sitemap URLs for @nuxtjs/sitemap

**Admin endpoints** (all under `/admin/`, require `NUXT_ADMIN_TOKEN` in `Authorization` header):
- `POST /api/admin/login` — Auth endpoint; returns token cookie
- `GET /api/admin/stats` — Dashboard stats (leads/bookings counts, etc.)
- `GET /api/admin/leads` — List leads
- `PATCH /api/admin/leads/[id]` — Update lead (status, notes, etc.)
- `DELETE /api/admin/leads/[id]` — Delete lead
- `GET /api/admin/bookings` — List bookings
- `PATCH /api/admin/bookings/[id]` — Update booking (status, notes, etc.)
- `DELETE /api/admin/bookings/[id]` — Delete booking
- `GET /api/admin/content/homepage` — Get editable homepage content
- `PUT /api/admin/content/homepage` — Update homepage content
- `GET /api/admin/content/services` — Get editable services
- `PUT /api/admin/content/services` — Update services
- `GET /api/admin/notifications/count` — Unread notification count
- `GET /api/admin/bookings/[id]/attachment/[idx]` — Fetch booking attachment (PDF, image, etc.)

**Utilities:**
- `server/utils/auth.ts` — Token validation
- `server/utils/storage.ts` — KV read/write (abstracts Cloudflare KV or in-memory fallback)
- `server/utils/validation.ts` — Zod schemas for contact, booking, etc.
- `server/utils/homepage-defaults.ts` — Default homepage content structure
- `server/utils/services-defaults.ts` — Default services structure
- `server/utils/settings.ts` — Admin settings (site config, notifications, etc.)
- `server/utils/telegram.ts` — Telegram bot integration for notifications
- `server/utils/notifications.ts` — In-app notification queue

### Composables

- `useAdminNotifications` — Real-time notification polling for admin panel

### Content & i18n

- `/app/content/services.ts` — Exported services object for import-time i18n (used in pages)
- `/i18n/i18n.config.ts` — i18n module config
- Locale files: Not in repo; defined inline via i18n module config

### Storage & KV

Local dev uses filesystem storage (`.data/kv/`). Production uses Cloudflare KV binding `CACHE`.

Keys stored:
- `homepage:<locale>` — Homepage content (title, description, hero image, features, etc.)
- `services:<locale>` — Services list
- `settings` — Admin settings (notification preferences, Telegram token, etc.)
- `notifications:<user-id>` — Unread notifications queue
- `bookings:*`, `leads:*` — Booking & lead records

## Important Patterns

### Auth
Admin routes check `NUXT_ADMIN_TOKEN` via middleware or endpoint validation. Token is set via `NUXT_ADMIN_TOKEN` env var. Login endpoint stores token in cookie (secure, HTTP-only in prod).

### Content Editing
Homepage and services are stored in KV and editable via admin endpoints. Local dev reads/writes to `.data/kv/`. Changes are persisted to KV in prod.

### Attachments
Bookings and leads can have attachments (PDFs, images). Stored in KV with key `bookings:<id>:attachments` or `leads:<id>:attachments` as compressed blob. Retrieved via `/api/admin/bookings/[id]/attachment/[idx]`.

### Validation
All POST/PUT endpoints use Zod schemas (in `server/utils/validation.ts`) to validate input. Invalid payloads return 400 with error details.

### Notifications
Real-time notifications to admins when new bookings/leads arrive. Telegram integration via `telegram.ts` (optional, requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`).

## Environment Variables

| Variable | Notes |
|---|---|
| `NUXT_ADMIN_TOKEN` | Shared secret for admin login (required for admin access) |
| `NUXT_PUBLIC_SITE_URL` | Canonical URL (e.g., `https://kostech.md`) |
| `TELEGRAM_BOT_TOKEN` | Optional Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | Optional Telegram chat ID for admin notifications |

See `.env.example` for template.

## Deployment

Deployed to Cloudflare Pages via `pnpm build && pnpm deploy` (runs `wrangler pages deploy dist`).

Build output: `apps/web/dist/` (prerendered + worker function).

Cloudflare KV bindings (set in `wrangler.toml`):
- `CACHE` — General storage (homepage, services, settings, notifications, attachments)

## TypeScript

Strict mode enabled (`typescript.strict: true`). Type-checking disabled at build time (`typeCheck: false`) for faster builds; use `pnpm typecheck` separately.

`tsconfig.json` in apps/web is minimal (inherits from Nuxt's generated schema).

## Theme & Colors

Dark mode: `localStorage.getItem('kostech-theme')` → `'dark'` or `'light'`, or system preference fallback. No-flash inline script in `app.head` reads preference before paint.

Tailwind config: Default (v4). Custom colors may be in `tailwind.config.*` (check at root or in apps/web).

## Important Notes

- **Prerendering**: Heavy use of `prerender` in `nitro` config. Changes to prerendered routes require rebuild.
- **i18n routing**: Strategy is `prefix_except_default` — `/servicii` is Ro, `/ru/servicii` is Ru, `/en/servicii` is En.
- **KV in dev**: Falls back to filesystem (`fs` driver) at `.data/kv/`. Clear this dir to reset storage.
- **Cloudflare preset**: `nitro.preset: 'cloudflare_pages'` — changes to server code require rebuild for deploy (not auto-reloaded in dev).
