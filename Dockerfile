# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace root files needed for install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/

# Install all dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy full source tree
COPY . .

# Build with node-server preset (overrides nuxt.config.ts default cloudflare_pages)
ENV NITRO_PRESET=node_server
RUN pnpm build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy workspace metadata + lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/

# Install only runtime dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built Nitro server output from build stage
COPY --from=build /app/apps/web/.output ./.output

# Create persistent data directory for KV filesystem storage
RUN mkdir -p .data/kv

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
