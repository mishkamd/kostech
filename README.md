# @kostech/web

Modern Kostech website — **Nuxt 4 + TailwindCSS v4 + Cloudflare Pages**.

## Stack
- Nuxt 4 (`compatibilityVersion: 4`), TypeScript strict
- Tailwind CSS v4 via `@tailwindcss/vite`
- `@nuxt/icon` (Iconify: fa6-solid/regular/brands, lucide)
- `@nuxt/image`, `@nuxtjs/color-mode`, `@nuxtjs/seo`, `@vueuse/nuxt`
- Server API on Nitro, deployed as Cloudflare Pages Functions
- Storage: Cloudflare KV (binding `CACHE`) with in-memory fallback for local dev

## Pages
- `/` — bento home (mirror of root `index.html` design)
- `/servicii`, `/servicii/[slug]` — services list & detail with FAQ JSON-LD
- `/booking` — 4-step booking wizard
- `/contact` — contact form
- `/admin/login`, `/admin`, `/admin/leads`, `/admin/bookings` — simple admin

## Local dev (no wrangler required)
```bash
pnpm install
pnpm --filter @kostech/web dev
# → http://127.0.0.1:3001
```
KV/D1/R2 calls fall back to in-memory storage in dev. To test against real bindings use `pnpm wrangler pages dev` after `pnpm build` (requires glibc ≥ 2.35).

## Build & deploy
```bash
pnpm --filter @kostech/web build       # → apps/web/dist
pnpm --filter @kostech/web deploy      # wrangler pages deploy
```

## Env
| Var                          | Notes                                 |
| ---------------------------- | ------------------------------------- |
| `NUXT_ADMIN_TOKEN`           | Shared secret for `/admin/login`       |
| `NUXT_PUBLIC_SITE_URL`       | Canonical URL (e.g. `https://kostech.md`) |
| `NUXT_TURNSTILE_SITE_KEY`    | Optional Cloudflare Turnstile site key |
| `NUXT_TURNSTILE_SECRET_KEY`  | Optional Cloudflare Turnstile secret   |

## Theme
Class-based dark mode via `@nuxtjs/color-mode` (cookie key `kostech-theme`), with no-flash inline script in `app.head`. Toggle via the header button.
