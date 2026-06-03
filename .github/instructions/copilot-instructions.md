
# Mobile-First Development Standards

Aceste instrucțiuni se aplică **întotdeauna** la orice cod generat în acest proiect.

---

## 1. Mobile-First Responsive Design

- **Base mobile → Enhance desktop.** Scrie întotdeauna stilurile de bază pentru mobile (implicit), apoi adaugă breakpoint-uri `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px) pentru a îmbunătăți layout-ul pe ecrane mai mari.
- **Fără breakpoint-uri `max-`** decât dacă e strict necesar (ex: corecții specifice pentru o singură dimensiune).
- **Touch-friendly.** Elementele interactive (butoane, linkuri, câmpuri de input) trebuie să aibă minimum `min-h-[44px]` și `min-w-[44px]` (ghidul Apple HIG).
- **Layout responsive.** Folosește:
  - `grid` + `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pentru grid-uri
  - `flex` + `flex-wrap` + `gap-*` pentru layout-uri flexibile
  - `container` + `mx-auto` + `px-4` pentru pagină centrată
- **Text responsive.** Dimensiuni de font:
  - `text-sm` sau `text-base` pe mobil
  - `text-lg` sau `text-xl` pe desktop (prin `md:text-lg`)
- **Imagini responsive.** Folosește `w-full h-auto` + `object-fit-*` + `NuxtImg` cu `sizes` attribute.
- **Testează vizual** pe 320px, 375px, 768px, 1024px, 1440px.

## 2. Nuxt 4 SSR

- **`<script setup lang="ts">`** — singurul format acceptat pentru componente și pagini.
- **Composition API** — fără Options API (`data()`, `methods`, `computed` ca opțiuni).
- **`definePageMeta()`** — obligatoriu în fiecare pagină pentru `title`, `description`, layout.
- **`useSeoMeta()`** — pentru meta tags SEO (title, description, og:*).
- **`useFetch()` / `useAsyncData()`** — pentru date asincrone; setează `server: true` (default) pentru SSR.
- **`useHead()`** — pentru JSON-LD schema.org și scripturi în head.
- **`NuxtLink`** — pentru navigare internă (nu `<a href="...">`).
- **`NuxtImg`** — pentru imagini optimizate (din `@nuxt/image`).
- **`definePageMeta({ layout: false })`** sau specific numele layout-ului.
- **Middleware** — nume tip `*.global.ts` pentru auto-aplicare sau `*.ts` pentru aplicare manuală pe rute.
- **Server routes** — `/server/api/[name].{get,post,patch,delete}.ts` cu `defineEventHandler()`.

## 3. TailwindCSS v4

- **`@import "tailwindcss"`** — sintaxa v4 (fără `@tailwind` directives).
- **`@theme`** — definește token-i personalizați (culori, fonturi, radius, shadow).
- **`@custom-variant dark`** — pentru varianta dark mode.
- **Dark mode:** Folosește clasa `.dark` pe `<html>` + variantele `dark:` în clase.
- **Design tokens existente** (din `tailwind.css`):
  ```
  --color-primary: #635BFF
  --color-primary-hover: #524CE0
  --color-light-bg: #F8F9FA
  --color-dark-bg: #13111C
  --color-dark-card: #1C1A27
  --color-dark-border: #2C283B
  --radius-bento: 2rem
  ```
  Folosește `bg-primary`, `text-primary`, `bg-light-bg`, `dark:bg-dark-bg` etc.
- **Fără `@apply`** în blocuri CSS custom decât în `@layer components` pentru pattern-uri repetitive.
- **Font:** `font-sans` (Inter Variable, deja configurat).
- **Responsive:** Folosește `sm:`, `md:`, `lg:` în clase (nu în media query-uri manuale).

## 4. shadcn-vue (Componente UI)

- **Pentru componente UI noi**, folosește **shadcn-vue** în loc să creezi componente custom de la zero (ex: `Button`, `Card`, `Dialog`, `Input`, `Select`, `Toast`, `Sheet`, `DropdownMenu`).
- **Adaugă componente** prin CLI:
  ```bash
  npx shadcn-vue@latest add button card dialog input
  ```
- **Personalizează** variabilele CSS din `app/assets/css/tailwind.css` (shadcn-vue citește token-ii Tailwind).
- **Nu duplica** componente existente — verifică `components/ui/` înainte de a crea una nouă.
- **Migrare graduală:** Componentele custom existente (`UiButton`, `UiInput`, `UiBadge`, `BentoCard`, `BentoGrid`) rămân, dar pentru feature-uri noi preferă shadcn-vue.

## 5. Iconify (`@nuxt/icon`)

- **`<Icon name="lucide:icon-name" />** — pentru iconițe generale UI.
- **Seturi instalate:** `lucide`, `fa6-solid`, `fa6-regular`, `fa6-brands`.
- **Preferință:** Lucide pentru UI general, FontAwesome Solid pentru acțiuni, FontAwesome Brands pentru sociale.
- **Dimensiune:** implicit `size="1em"`, setează explicit `size="24"` sau `class="w-5 h-5"` când e nevoie.
- **Culoare:** moștenește `currentColor` — folosește `class="text-primary"` pentru colorare.

## 6. Better Auth (Autentificare)

- **Pentru orice cod nou de autentificare**, folosește **Better Auth** în loc de cookie-uri manuale.
- **Instalare:**
  ```bash
  pnpm add better-auth @better-auth/nuxt
  ```
- **Configurare în `nuxt.config.ts`:**
  ```ts
  modules: ['@better-auth/nuxt']
  ```
- **Server utils:** Creează `server/utils/auth.ts` cu `better-auth` instance.
- **Protejare rute:** Folosește `better-auth` middleware, nu cookie-uri manuale.
- **Admin login existent** (cookie simplu) va fi migrat treptat; codul nou trebuie să folosească Better Auth.

## 7. Conveții Generale de Cod

- **Nume fișiere:** PascalCase pentru componente (`UiButton.vue`), kebab-case pentru pagini (`booking.vue`).
- **Auto-import:** Componentele din `components/` se auto-importă — nu le importa manual.
- **Props:** Definiește props cu `defineProps<{ ... }>()` (type-based, nu runtime).
- **Emits:** Folosește `defineEmits<{ ... }>()`.
- **Refs:** `ref()`, `computed()`, `reactive()` din Vue; `useLocalStorage()`, `useMediaQuery()` din VueUse.
- **i18n:** Folosește `const { t } = useI18n()`; cheile sunt în `i18n/i18n.config.ts`.
- **Fetch API:** Folosește `useFetch()` cu tipizare: `useFetch<ResponseType>(url)`.
- **Zod:** Folosește `zod` pentru validare date atât client cât și server.
- **Tipuri:** Exportă tipurile în fișiere `.ts` separate, nu în `.vue`.
- **Fără `any`** — folosește tipuri explicite sau `unknown` cu type guard.

## 8. Structura Fișierelor (pentru cod nou)

```
components/
  layout/       # Header, Footer, ThemeToggle
  ui/           # shadcn-vue (Button, Card, Input…) + existing custom
pages/
  [feature]/    # File-based routing
server/
  api/          # H3 endpoints
  utils/        # better-auth, validation
  middleware/   # Security headers
app/
  assets/css/   # tailwind.css (tokens + global styles)
  composables/  # Vue composables reutilizabile
```
