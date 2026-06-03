# Deploy pe Cloudflare Pages

Aplicația folosește **Nitro preset `cloudflare_pages`** → `pnpm build` produce `apps/web/dist/_worker.js` + asset-uri statice, gata pentru `wrangler pages deploy` sau Git integration.

Surse oficiale (mai 2026):

- <https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/>
- <https://nuxt.com/deploy/cloudflare>

## Notificări admin & Telegram (post-deploy checklist)

După deploy, ca notificările Telegram să funcționeze:

1. Login în admin (`/admin/login` cu `NUXT_ADMIN_TOKEN`).
2. Deschide `/admin/telegram`, lipește Bot Token + Chat ID, bifează *Activează*, salvează.
3. Apasă **Trimite mesaj test** — verifică pe Telegram.

Token-ul se salvează în KV (key `settings:admin`), deci **nu trebuie să adaugi niciun env var în Pages dashboard pentru asta**.

## 1. Prerechizite Cloudflare

1. Cont Cloudflare (planul **Free** este suficient pentru trafic redus).
2. **API Token** cu permisiunile:
   - `Cloudflare Pages → Edit`
   - `Workers KV Storage → Edit`
   - opțional `R2 → Edit`, `D1 → Edit`
3. **Account ID** din dashboard (sidebar dreapta).

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
```

## 2. Provisioning (one-time)

```bash
chmod +x scripts/cf-bootstrap.sh
./scripts/cf-bootstrap.sh
```

Scriptul:

1. Creează proiectul Pages `kostech-web` (production branch `main`).
2. Creează KV namespace `kostech_cache` și afișează ID-ul.

Apoi **decomentează** în [apps/web/wrangler.toml](../apps/web/wrangler.toml):

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "<ID_din_output>"
```

Opțional R2 / D1:

```bash
npx wrangler r2 bucket create kostech-web-media
npx wrangler d1 create kostech-web
```

## 3. Secretele de producție

```bash
cd apps/web

# Token admin puternic
npx wrangler pages secret put NUXT_ADMIN_TOKEN --project-name=kostech-web
#   → în prompt: openssl rand -hex 32

# Doar dacă folosești Turnstile
npx wrangler pages secret put NUXT_TURNSTILE_SECRET_KEY --project-name=kostech-web
```

Variabile **publice** (siteUrl, Turnstile site key) prin dashboard → Pages → Settings → Environment variables, sau `--var` la deploy.

## 4. Deploy manual (Direct Upload)

```bash
pnpm --filter @kostech/web build
cd apps/web
npx wrangler pages deploy dist --project-name=kostech-web --branch=main
```

- URL preview: `https://<hash>.kostech-web.pages.dev`
- URL prod: `https://kostech-web.pages.dev`

## 5. Deploy automat — GitHub Actions

Workflow-ul [.github/workflows/web-deploy.yml](../.github/workflows/web-deploy.yml) deploy-uiește la push pe `main`.

**Secrete GitHub** (Settings → Secrets and variables → Actions):

| Nume | Sursă |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages → Account ID |
| `LHCI_GITHUB_APP_TOKEN` | opțional, pentru Lighthouse CI |

Trigger-e: push pe `main` cu modificări sub `apps/web/**`, plus manual prin `workflow_dispatch`.

## 6. Git integration Cloudflare (alternativă fără GitHub Actions)

1. Dashboard → Workers & Pages → **Create application** → Pages → **Connect to Git**.
2. Build settings:
   - **Framework preset**: Nuxt
   - **Build command**: `pnpm --filter @kostech/web build`
   - **Output directory**: `apps/web/dist`
   - **Environment variables**: `NUXT_PUBLIC_SITE_URL=https://kostech.md`, `NODE_VERSION=22`
3. Save and Deploy.

Cloudflare creează automat preview deployments pentru fiecare PR.

> ⚠️ Cu Git integration, `wrangler.toml` NU este detectat — bindingurile KV/R2/D1 trebuie adăugate manual în dashboard → Pages project → Settings → Functions → Bindings.

## 7. Configurare bindings în dashboard

Dacă folosești Git integration sau vrei să le confirmi:

1. Pages project → **Settings** → **Functions** → **KV namespace bindings**.
2. Add: variable name `CACHE` → namespace `kostech_cache`.
3. Save → trigger un re-deploy pentru a aplica.

Pentru R2: **R2 bucket bindings** → `MEDIA` → `kostech-web-media`.

## 8. Custom domain

1. Dashboard → kostech-web → **Custom domains** → **Set up a custom domain**.
2. Adaugă `kostech.md` (+ `www.kostech.md`).
3. Cloudflare creează CNAME → `kostech-web.pages.dev` + SSL Universal automat.
4. Update `NUXT_PUBLIC_SITE_URL` la `https://kostech.md` și re-deploy pentru regenerare sitemap/OG.

## 9. Verificare post-deploy

```bash
curl -I https://kostech.md           # HTTP/2 200 + security headers
curl https://kostech.md/sitemap.xml  # XML valid cu toate rutele
curl https://kostech.md/robots.txt   # Disallow /admin
```

OG preview: <https://www.opengraph.xyz/url/https%3A%2F%2Fkostech.md>

Manual checklist:

- [ ] Toggle dark/light persistă peste refresh
- [ ] `/admin` → redirect `/admin/login`
- [ ] Login cu `NUXT_ADMIN_TOKEN` acordă acces
- [ ] `POST /api/contact` → `{ok:true, id:"lead_..."}`
- [ ] Lead-ul apare în `/admin/leads`

## 10. Rollback

```bash
npx wrangler pages deployment list --project-name=kostech-web
```

Rollback rapid din dashboard: Project → **Deployments** → ⋯ → **Rollback to this deployment**.

## 11. Monitorizare & logs

```bash
# Live tail logs
npx wrangler pages deployment tail --project-name=kostech-web
```

Dashboard → Workers & Pages → kostech-web → **Analytics** (requests, errors, p50/p95 latency).

## 12. Costuri estimate (mai 2026)

| Resursă | Free tier | Paid trigger |
| --- | --- | --- |
| Pages build minutes | 500/lună | $0.005/min |
| Pages requests (assets) | nelimitate | gratuite |
| Workers requests | 100k/zi | $0.30/M (10M incluse pe Paid $5/lună) |
| KV reads | 100k/zi | $0.50/M |
| KV writes | 1k/zi | $5/M |
| Custom domain + SSL | gratuit | — |

Pentru un site marketing cu < 10k vizite/zi, **planul Free este suficient**.

## 13. Checklist deploy producție

- [ ] `pnpm typecheck` + `pnpm build` verzi local
- [ ] `wrangler.toml` cu KV binding decomentat și ID real (SAU bindings setate în dashboard)
- [ ] `NUXT_ADMIN_TOKEN` setat ca secret (NU `dev-admin-token`)
- [ ] `NUXT_PUBLIC_SITE_URL` apunctă către domeniul final
- [ ] OG-images regenerate cu URL-ul final
- [ ] Custom domain conectat + SSL activ
- [ ] Sitemap + robots.txt verificate manual
- [ ] Lighthouse ≥ 95 pe Performance / A11y / SEO
- [ ] Admin login funcțional cu token de producție
- [ ] Plan de backup KV (cron → R2, opțional)
