# Kostech Architecture & Deployment Guide

## Table of Contents

1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Storage Layer](#data-storage-layer)
5. [Authentication System](#authentication-system)
6. [API Reference](#api-reference)
7. [Internationalization (i18n)](#internationalization-i18n)
8. [Component Architecture](#component-architecture)
9. [Deployment: Cloudflare Pages](#deployment-cloudflare-pages)
10. [Deployment: Docker](#deployment-docker)
11. [Environment Variables](#environment-variables)

---

## Application Overview

**Kostech** is a Romanian IT services company website serving Chișinău, Moldova. It is a
**Nuxt 4** application that supports **server-side rendering (SSR)**, **static generation**
(prerendering), and **interactive client-side features** (booking wizard, admin panel).

The app is trilingual (Romanian, Russian, English) and offers:

- **Public site**: Home page with bento-grid layout, services listing/detail pages with
  FAQ JSON-LD structured data, and a 4-step booking wizard with file attachments.
- **Admin panel**: Dashboard with stats, lead/booking management (CRUD + status
  workflows), content editing for homepage and services, user management, Telegram
  notification integration, and real-time notification polling.
- **Telegram bot**: Webhook-based integration for admin notifications on new
  leads/bookings and status changes.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│  Vue 3 SPA (hydrated from SSR)                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────────┐  │
│  │ Home     │ │ Services │ │ Booking  │ │ Admin Panel           │  │
│  │ (bento)  │ │ list/det │ │ (wizard) │ │ (dashboard, CRUD)     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────────┘  │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTP requests
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       NUXT 4 + NITRO SERVER                          │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Vue SSR Render  │  │  API Routes      │  │  Server Utils    │   │
│  │ (pages, layouts)│  │  /api/contact    │  │  auth.ts         │   │
│  │                  │  │  /api/bookings   │  │  storage.ts      │   │
│  │ TailwindCSS v4  │  │  /api/admin/*    │  │  validation.ts   │   │
│  │ i18n, SEO mods  │  │  /api/telegram/* │  │  notifications   │   │
│  └─────────────────┘  └──────────────────┘  └──────────────────┘   │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   STORAGE LAYER          │   │   EXTERNAL SERVICES      │
│                          │   │                          │
│  Cloudflare KV (prod)    │   │  Telegram Bot API        │
│  ─────────────────────── │   │  (notifications)         │
│  Filesystem FS (dev/     │   │                          │
│  Docker)                 │   │                          │
│                          │   │                          │
│  Keys:                   │   │                          │
│  - user:*                │   │                          │
│  - session:*             │   │                          │
│  - bookings:*            │   │                          │
│  - leads:*               │   │                          │
│  - homepage:<locale>     │   │                          │
│  - services:<locale>     │   │                          │
│  - settings:admin        │   │                          │
│  - notifications:*       │   │                          │
└──────────────────────────┘   └──────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Nuxt 4 (Vue 3.5) | `compatibilityVersion: 4`, strict TypeScript |
| **Runtime** | Node.js ≥ 20.19 | Required by Nuxt 4 |
| **Styling** | Tailwind CSS v4 | Via `@tailwindcss/vite` plugin |
| **Icons** | Iconify | fa6-solid, fa6-regular, fa6-brands, lucide |
| **i18n** | @nuxtjs/i18n v9 | RO (default), RU, EN |
| **SEO** | @nuxtjs/sitemap, @nuxtjs/robots | Auto-sitemap + dynamic routes |
| **Image** | @nuxt/image | AVIF/WebP optimization |
| **Validation** | Zod 3 | All API endpoints validated |
| **Server** | Nitro (built into Nuxt) | Preset-swappable |
| **Storage (Cloudflare)** | Cloudflare KV | Binding name: `CACHE` |
| **Storage (Docker/dev)** | Filesystem (unjs/unstorage `fs` driver) | `.data/kv/` directory |
| **Notifications** | Telegram Bot API | Webhook-based |
| **Auth** | PBKDF2 (Web Crypto) + httpOnly cookies | Session TTL: 7 days |
| **Testing** | Playwright | 5 E2E smoke tests |
| **Package Manager** | pnpm 9.15 | Workspace monorepo |

---

## Project Structure

```
tech2/                           # Monorepo root
├── pnpm-workspace.yaml          # pnpm workspace config
├── package.json                 # Root scripts (delegate to apps/web)
├── pnpm-lock.yaml               # Lockfile
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.yml           # Docker Compose with persistent volume
├── .dockerignore
├── ARCHITECTURE.md              # This document
│
└── apps/web/                    # @kostech/web — the Nuxt application
    ├── nuxt.config.ts           # Nuxt + Nitro + module config
    ├── package.json             # Dependencies & scripts
    ├── tsconfig.json            # Extends .nuxt/tsconfig.json
    ├── wrangler.toml            # Cloudflare Pages + KV bindings
    │
    ├── app/                     # Vue application source
    │   ├── app.vue              # Root: <NuxtLayout><NuxtPage/>
    │   ├── assets/css/
    │   │   └── tailwind.css     # Tailwind v4 imports + custom theme
    │   ├── components/
    │   │   ├── layout/          # Header, Footer, ThemeToggle, etc.
    │   │   └── ui/              # BentoGrid, BentoCard, buttons, inputs
    │   ├── composables/         # useAdminNotifications, useToast, useAttachments
    │   ├── content/
    │   │   └── services.ts      # Service definitions (6 services × 3 locales)
    │   ├── layouts/             # default.vue, admin.vue, auth.vue
    │   ├── middleware/
    │   │   └── admin.global.ts  # Route guard for /admin/*
    │   └── pages/
    │       ├── index.vue        # Home (bento grid)
    │       ├── booking.vue      # 4-step booking wizard
    │       ├── servicii/        # /servicii, /servicii/[slug]
    │       └── admin/           # Dashboard, leads, bookings, content, users…
    │
    ├── i18n/
    │   └── i18n.config.ts      # Locale messages (nav, forms, UI strings)
    │
    ├── server/                  # Nitro server (API + middleware)
    │   ├── api/
    │   │   ├── bookings.post.ts
    │   │   ├── contact.post.ts
    │   │   ├── __sitemap__/urls.ts
    │   │   ├── admin/           # 20+ admin endpoints
    │   │   └── telegram/        # Webhook handler
    │   ├── middleware/
    │   │   └── security.ts      # Security headers (HSTS, CSP, etc.)
    │   └── utils/
    │       ├── storage.ts       # KV abstraction (Cloudflare + fs fallback)
    │       ├── auth.ts          # PBKDF2 auth + session management
    │       ├── validation.ts    # Zod schemas
    │       ├── settings.ts      # Admin settings CRUD
    │       ├── notifications.ts # Telegram notification dispatch
    │       ├── telegram.ts      # Telegram Bot API client
    │       ├── homepage-defaults.ts
    │       └── services-defaults.ts
    │
    ├── public/                  # Static assets
    │   ├── favicon.svg
    │   ├── fonts/
    │   └── og/                  # Open Graph images (pre-generated PNGs)
    │
    └── scripts/
        ├── copy-fonts.mjs       # Postinstall: copy Inter Variable font
        └── generate-og.mjs      # Generate OG images (build-time script)
```

---

## Data Storage Layer

The storage layer is a key-value abstraction that works identically across three
environments with a single code path.

### Storage Abstraction (`server/utils/storage.ts`)

The module exposes five functions used by all other server code:

| Function | Purpose |
|---|---|
| `kvGet(event, key)` | Read a JSON value by key |
| `kvPut(event, key, value)` | Write a JSON value |
| `kvDelete(event, key)` | Delete a key |
| `kvList(event, prefix)` | List all keys matching a prefix |
| `newId(prefix)` | Generate a unique ID (`{prefix}_{timestamp36}{random6}`) |

### Environment-Specific Backends

The function `getKV(event)` checks for a Cloudflare KV binding first, falls back to
Nitro's built-in storage (`useStorage('cache')`) otherwise:

```
┌─────────────────────────────────────────────────────────────┐
│                    storage.ts                               │
│                                                             │
│  getKV(event)                                               │
│    │                                                        │
│    ├─ event.context.cloudflare.env.CACHE exists?            │
│    │  └─ YES → Cloudflare KV (production)                   │
│    │                                                         │
│    └─ NO → useStorage('cache')                              │
│              │                                               │
│              ├─ NODE_ENV=development                        │
│              │  └─ nitro.devStorage.cache → fs driver       │
│              │     path: .data/kv/                          │
│              │                                               │
│              └─ NODE_ENV=production (Docker/bare metal)     │
│                 └─ nitro.storage.cache → fs driver          │
│                    path: .data/kv/                          │
└─────────────────────────────────────────────────────────────┘
```

### Storage Keys (All Environments)

| Key Pattern | Content | Example |
|---|---|---|
| `user:{id}` | Admin user (PBKDF2 hash + salt) | `user:m0l2x3abc` |
| `session:{token}` | Admin session (userId + expiresAt) | `session:a1b2c3...` |
| `bookings:{id}` | Booking record | `bookings:m0l3x4def` |
| `leads:{id}` | Lead/contact record | `leads:m0l4x5ghi` |
| `homepage:{locale}` | Homepage content blocks | `homepage:ro` |
| `services:{locale}` | Services list | `services:ro` |
| `settings:admin` | Admin settings + Telegram config | — |
| `notifications:{userId}` | Unread notification items | — |

### Cloudflare KV (Production)

On Cloudflare Pages, the KV namespace is bound as `CACHE` (configured in
`wrangler.toml` and the Cloudflare Dashboard). The binding is injected into
`event.context.cloudflare.env.CACHE` by the Cloudflare Pages runtime.

```
wrangler.toml
────────────────────────────
[[kv_namespaces]]
binding = "CACHE"
id = "<kv-namespace-id>"
```

### Filesystem Storage (Development & Docker)

In development (`pnpm dev`) and in Docker, KV operations write to the filesystem
under `.data/kv/`. The directory structure mirrors the key hierarchy:

```
.data/kv/
├── user/
│   └── m0l2x3abc.json
├── session/
│   └── a1b2c3....json
├── bookings/
│   └── m0l3x4def.json
├── leads/
│   └── ...
├── homepage/
│   ├── ro.json
│   ├── ru.json
│   └── en.json
├── services/
│   ├── ro.json
│   ├── ru.json
│   └── en.json
└── settings/
    └── admin.json
```

**Docker**: The `.data/kv/` directory is mounted as a named volume (`kv-data`), so
data persists across container restarts and rebuilds.

---

## Authentication System

### Password Hashing

- Algorithm: **PBKDF2** via the Web Crypto API (`crypto.subtle.deriveBits`)
- Iterations: **100,000**
- Hash function: **SHA-256**
- Key length: **256 bits**
- Salt: **128 bits** random per user

### Session Management

- Sessions stored in KV under `session:{token}` with `userId` and `expiresAt`
- Two cookies set on login:
  - `kostech_admin` — httpOnly, contains the session token (secure in production)
  - `kostech_admin_ok` — readable indicator for client-side auth checks
- Session TTL: **7 days**
- `SameSite: Lax`

### Bootstrap Admin

On first run, `ensureBootstrapUser()` checks if any users exist. If not, it creates
an admin user from environment variables:

- Username: `NUXT_ADMIN_USERNAME` (default: `admin`)
- Password: `NUXT_ADMIN_TOKEN` (default: `dev-admin-token`)

### Auth Flow

```
POST /api/admin/login
  { username, password }
       │
       ▼
  getUserByUsername(event, username)
       │
       ├─ User not found → 401
       │
       └─ User found
            │
            ▼
         verifyPassword(password, hash, salt)
            │
            ├─ Mismatch → 401
            │
            └─ Match
                 │
                 ▼
              createSession(event, userId)
                 │
                 ▼
              Set-Cookie: kostech_admin=<token>
              Set-Cookie: kostech_admin_ok=1
                 │
                 ▼
              200 { user: SafeUser }
```

All admin API routes call `requireAdmin(event)` which:
1. Reads the `kostech_admin` cookie
2. Looks up the session in KV
3. Checks expiration
4. Returns the user object (or throws 401)

---

## API Reference

### Public Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/content/homepage?locale=ro` | No | Homepage content |
| `GET` | `/api/content/services?locale=ro` | No | Services list |
| `POST` | `/api/contact` | No | Submit contact form |
| `POST` | `/api/bookings` | No | Submit booking |
| `GET` | `/api/__sitemap__/urls` | No | Dynamic sitemap URLs |
| `POST` | `/api/telegram/webhook` | Telegram | Bot webhook handler |

### Admin Endpoints (require `kostech_admin` cookie)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate, create session |
| `POST` | `/api/admin/logout` | Destroy session |
| `GET` | `/api/admin/stats` | Dashboard stats (counts) |
| `GET` | `/api/admin/leads` | List leads |
| `PATCH` | `/api/admin/leads/[id]` | Update lead status/notes |
| `DELETE` | `/api/admin/leads/[id]` | Delete lead |
| `GET` | `/api/admin/leads/[id]/attachment/[idx]` | Fetch attachment |
| `GET` | `/api/admin/bookings` | List bookings |
| `PATCH` | `/api/admin/bookings/[id]` | Update booking status/notes |
| `DELETE` | `/api/admin/bookings/[id]` | Delete booking |
| `GET` | `/api/admin/bookings/[id]/attachment/[idx]` | Fetch attachment |
| `GET` | `/api/admin/content/homepage` | Get homepage (all locales) |
| `PUT` | `/api/admin/content/homepage` | Update homepage locale |
| `GET` | `/api/admin/content/services` | Get services (all locales) |
| `PUT` | `/api/admin/content/services` | Update services locale |
| `GET` | `/api/admin/settings` | Get settings (redacted) |
| `PUT` | `/api/admin/settings` | Update settings |
| `GET` | `/api/admin/users` | List users |
| `POST` | `/api/admin/users` | Create user |
| `PATCH` | `/api/admin/users/[id]` | Update user password |
| `DELETE` | `/api/admin/users/[id]` | Delete user |
| `GET` | `/api/admin/notifications/count` | Unread count + items |
| `POST` | `/api/admin/notifications/mark-read` | Mark as read |
| `POST` | `/api/admin/telegram/test` | Test Telegram connection |
| `POST` | `/api/admin/telegram/webhook-setup` | Configure webhook |

### Status Workflows

Bookings and leads share a 4-state workflow:

```
  new ──→ in_progress ──→ done
   │                        ↑
   └──────→ canceled ───────┘
```

Status changes trigger Telegram notifications when configured.

### Validation

All `POST`/`PUT`/`PATCH` endpoints validate request bodies with Zod schemas defined
in `server/utils/validation.ts`. Invalid payloads return `400 Bad Request` with
Zod error details.

---

## Internationalization (i18n)

**Strategy**: `prefix_except_default` — Romanian (default) at root path, Russian and
English under `/ru/` and `/en/` prefixes.

| Locale | URL Pattern | Language Tag |
|---|---|---|
| Română (default) | `/servicii`, `/booking` | `ro-MD` |
| Русский | `/ru/servicii`, `/ru/booking` | `ru-RU` |
| English | `/en/servicii`, `/en/booking` | `en-US` |

**Two-layer content localization**:

1. **UI strings** (nav labels, buttons, form text): Managed by `@nuxtjs/i18n` in
   `i18n/i18n.config.ts`. These are bundled with the app.
2. **Content** (service descriptions, homepage text): Stored in KV under
   `homepage:{locale}` and `services:{locale}` keys. Editable via admin panel.
   Also mirrored in `app/content/services.ts` for import-time access.

**Locale detection**: Cookie-based (`kostech-locale`), no automatic redirect.

---

## Component Architecture

### Layout Components (`components/layout/`)

| Component | Purpose |
|---|---|
| `AppHeader.vue` | Main navigation + locale switcher + theme toggle |
| `AppFooter.vue` | Footer with contact info + links |
| `ThemeToggle.vue` | Dark/light mode switch |
| `AdminNotificationsBell.vue` | Real-time notification bell (admin only) |
| `ToastContainer.vue` | Toast notification queue |

### UI Components (`components/ui/`)

| Component | Purpose |
|---|---|
| `BentoGrid.vue` | CSS Grid container for bento layout |
| `BentoCard.vue` | Individual bento card with icon, title, description |
| `UiButton.vue` | Themed button (primary, secondary, outline variants) |
| `UiInput.vue` | Form input with label, error state |
| `UiTextarea.vue` | Form textarea with label, error state |

### Composables

| Composable | Purpose |
|---|---|
| `useAdminNotifications` | Polls `/api/admin/notifications/count` every 20s |
| `useToast` | Toast queue with auto-dismiss |
| `useAttachments` | File upload (max 3 files, 5MB each, image/PDF only) |

### Pages

| Route | Page | Prerendered? |
|---|---|---|
| `/` | `index.vue` (home, bento grid) | Yes (all 3 locales) |
| `/servicii` | `servicii/index.vue` (list) | Yes (all 3 locales) |
| `/servicii/[slug]` | `servicii/[slug].vue` (detail) | Yes (6 slugs × 3 locales) |
| `/booking` | `booking.vue` (4-step wizard) | Yes (all 3 locales) |
| `/admin/login` | `admin/login.vue` | No |
| `/admin` | `admin/index.vue` (dashboard) | No |
| `/admin/leads` | `admin/leads.vue` | No |
| `/admin/bookings` | `admin/bookings.vue` | No |
| `/admin/content` | `admin/content.vue` | No |
| `/admin/services` | `admin/services.vue` | No |
| `/admin/users` | `admin/users.vue` | No |
| `/admin/notifications` | `admin/notifications.vue` | No |
| `/admin/telegram` | `admin/telegram.vue` | No |

---

## Deployment: Cloudflare Pages

### Prerequisites

1. Cloudflare account with Pages and KV enabled
2. `wrangler` CLI installed (`pnpm add -g wrangler` or use the one in devDeps)
3. Git repository connected to Cloudflare Pages (or manual deploy via `wrangler`)

### Step 1: Create KV Namespace

```bash
wrangler kv:namespace create CACHE
```

Copy the generated namespace ID.

### Step 2: Configure wrangler.toml

Edit `apps/web/wrangler.toml`, uncomment and fill in the KV binding:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "abc123..."   # ← Paste your namespace ID here
```

### Step 3: Set Secrets

```bash
wrangler pages secret put NUXT_ADMIN_TOKEN
# Enter your secure admin token at the prompt
```

### Step 4: Build & Deploy

**Option A — Automatic Git integration** (recommended):

Connect your repository in the Cloudflare Pages dashboard:
- **Framework preset**: None (custom build)
- **Build command**: `pnpm build`
- **Build output directory**: `apps/web/dist`
- **Root directory**: `/`

**Option B — Manual deploy via CLI**:

```bash
cd apps/web
pnpm build
wrangler pages deploy dist
```

### Step 5: Bind KV in Cloudflare Dashboard

Go to **Pages → kostech-web → Settings → Functions → KV namespace bindings** and add:

| Variable | KV Namespace |
|---|---|
| `CACHE` | `CACHE` |

### How It Works on Cloudflare

```
Request → Cloudflare Pages
            │
            ├─ Static file? → Serve from edge cache (prerendered HTML)
            │
            └─ Dynamic route? → Pages Function (Nitro worker)
                                 │
                                 ├─ event.context.cloudflare.env.CACHE
                                 │  → Cloudflare KV (global, low-latency)
                                 │
                                 └─ Return SSR-rendered HTML or API response
```

- **Prerendered routes** (`/`, `/servicii`, `/booking`, service detail pages) are
  served as static HTML from the edge. No function invocation needed.
- **Dynamic routes** (admin panel, API endpoints) invoke the Pages Function, which
  runs the Nitro server compiled as a Cloudflare Worker (`dist/_worker.js`).
- **KV** is accessed through the `CACHE` binding injected by the Workers runtime.
- **Cold starts**: Cloudflare Workers cold start in < 5ms typically.

---

## Deployment: Docker

### Prerequisites

- Docker Engine ≥ 20.10
- Docker Compose ≥ 2.0

### Quick Start

```bash
# Clone and enter the repo
cd tech2

# Set your admin password (optional, defaults to dev-admin-token)
export NUXT_ADMIN_TOKEN=your-secure-token

# Build and start
docker compose up -d

# Check health
docker compose ps
curl http://localhost:3000
```

### What Happens During Build

```
docker compose up --build
        │
        ▼
┌──────────────────────────────────────┐
│ BUILD STAGE (node:20-alpine)         │
│                                      │
│  1. Install pnpm 9.15                │
│  2. Copy package manifests + lockfile│
│  3. pnpm install --frozen-lockfile   │
│  4. Copy full source tree            │
│  5. NITRO_PRESET=node_server         │
│  6. pnpm build                       │
│     └─ Nuxt builds with Node.js      │
│        server preset instead of      │
│        cloudflare_pages              │
│     Output: apps/web/.output/        │
│                                      │
├──────────────────────────────────────┤
│ PRODUCTION STAGE (node:20-alpine)    │
│                                      │
│  7. Install production deps only     │
│  8. Copy .output from build stage    │
│  9. Create .data/kv directory        │
│                                      │
│ RUNTIME:                             │
│  10. node .output/server/index.mjs   │
│      Listens on :3000                │
│      Storage: .data/kv/ (filesystem) │
│      Volume: kv-data (persistent)    │
└──────────────────────────────────────┘
```

### Docker Architecture

```
┌───────────────────────────────────────────┐
│              Docker Host                   │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ Container: kostech-web              │  │
│  │                                     │  │
│  │  Port 3000 → Node.js (Nitro)        │  │
│  │                                     │  │
│  │  ┌─────────────────────────────┐    │  │
│  │  │ Nitro node-server preset    │    │  │
│  │  │                             │    │  │
│  │  │ SSR: Vue → HTML             │    │  │
│  │  │ API: /api/* endpoints       │    │  │
│  │  │ Storage: fs driver          │    │  │
│  │  └──────────┬──────────────────┘    │  │
│  │             │                       │  │
│  │    ┌────────▼──────────┐            │  │
│  │    │ /app/.data/kv/    │            │  │
│  │    │ (mounted volume)  │            │  │
│  │    └───────────────────┘            │  │
│  └─────────────────┬───────────────────┘  │
│                    │                      │
│  ┌─────────────────▼───────────────────┐  │
│  │ Docker Volume: kv-data             │  │
│  │ (survives container rebuilds)       │  │
│  └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

### Docker Commands Reference

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down

# Stop and remove volume (WARNING: deletes all data!)
docker compose down -v

# Rebuild without cache
docker compose build --no-cache

# Run inside container
docker compose exec kostech sh

# Check data directory inside container
docker compose exec kostech ls -la .data/kv/
```

### Docker: Data Persistence & Backup

All KV data lives in the `kv-data` named volume. To back up:

```bash
# Create a backup
docker run --rm \
  -v tech2_kv-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/kv-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore a backup
docker run --rm \
  -v tech2_kv-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/kv-backup-YYYYMMDD.tar.gz -C /data
```

### Docker: Production Considerations

1. **Set a strong `NUXT_ADMIN_TOKEN`** — this is both the admin password and session
   encryption key.
2. **Use a reverse proxy** (Nginx, Caddy, Traefik) in front of the container for
   TLS termination, rate limiting, and caching.
3. **Set `NUXT_PUBLIC_SITE_URL`** to the actual public URL (e.g.,
   `https://kostech.md`) for correct sitemap and canonical URLs.
4. **Mount the KV volume to a specific host path** if you want easy filesystem access:

   ```yaml
   volumes:
     - ./data/kv:/app/.data/kv  # host path instead of named volume
   ```

5. **Telegram notifications**: Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
   environment variables for admin notifications on new leads/bookings.

---

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NUXT_ADMIN_TOKEN` | **Yes** | `dev-admin-token` | Admin password + session key |
| `NUXT_ADMIN_USERNAME` | No | `admin` | Bootstrap admin username |
| `NUXT_PUBLIC_SITE_URL` | No | `http://localhost:3000` | Canonical URL for SEO |
| `NITRO_PRESET` | Build-time | `cloudflare_pages` | Set to `node_server` for Docker |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot token for notifications |
| `TELEGRAM_CHAT_ID` | No | — | Telegram chat ID for admin alerts |
| `PORT` | No | `3000` | Server listen port |

---

## Comparison: Cloudflare vs Docker

| Aspect | Cloudflare Pages | Docker |
|---|---|---|
| **Hosting** | Serverless edge (global) | Self-hosted (single server) |
| **Scaling** | Automatic, infinite | Manual, depends on hardware |
| **Cold starts** | < 5ms (workers) | None (always warm) |
| **Storage** | Cloudflare KV (managed, global) | Filesystem on volume (local) |
| **Cost** | Free tier → pay-as-you-go | Server/hosting costs |
| **HTTPS** | Automatic (Cloudflare edge) | Manual (reverse proxy needed) |
| **Build** | `pnpm build` (CF preset) | `NITRO_PRESET=node_server pnpm build` |
| **Limits** | KV: 1 GiB storage, 1000 writes/s | Disk space only |
| **Telegram** | Webhook-based (CF worker URL) | Webhook-based (your domain) |
| **Maintenance** | Zero (managed platform) | OS updates, Docker updates |

### When to Use Cloudflare Pages

- You want zero-infrastructure deployment
- Global low-latency edge network is valuable
- KV storage limits (1 GiB, 1000 writes/s) are sufficient
- You're comfortable with the Cloudflare ecosystem

### When to Use Docker

- You need on-premise or private cloud hosting
- You want full control over the runtime environment
- You need guaranteed always-warm performance (no cold starts)
- You plan to integrate with other Docker services (databases, caches)
- Compliance/regulatory requirements mandate specific hosting

---

## Build Pipeline

```
Source Code (apps/web/)
        │
        ▼
  pnpm build  ◄── NITRO_PRESET (cloudflare_pages | node_server)
        │
        ├── cloudflare_pages ──→ dist/
        │                        ├── _worker.js     (Pages Function)
        │                        ├── _routes.json   (routing rules)
        │                        └── public/        (static assets)
        │
        └── node_server ──────→ .output/
                                 ├── server/
                                 │   ├── index.mjs  (server entry)
                                 │   └── chunks/    (bundled server code)
                                 └── public/        (static assets)
```

The key difference: Cloudflare produces a single Worker bundle; Node.js produces a
standalone Node.js server with chunked modules.
