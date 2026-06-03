#!/usr/bin/env bash
# cf-bootstrap.sh — provision Cloudflare resources for kostech-web.
# Requires: wrangler (npx) + CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID env vars.
set -euo pipefail

PROJECT="kostech-web"
KV_NAME="kostech_cache"

echo "==> Creating Cloudflare Pages project: $PROJECT"
npx wrangler pages project create "$PROJECT" --production-branch=main || \
  echo "   (project may already exist — continuing)"

echo "==> Creating KV namespace: $KV_NAME"
KV_OUTPUT=$(npx wrangler kv namespace create "$KV_NAME" 2>&1 || true)
echo "$KV_OUTPUT"

KV_ID=$(echo "$KV_OUTPUT" | grep -oE 'id = "[a-f0-9]+"' | head -1 | cut -d'"' -f2 || true)
if [[ -n "$KV_ID" ]]; then
  echo "   KV id: $KV_ID"
  echo ""
  echo "Add this binding to apps/web/wrangler.toml:"
  echo ""
  echo "[[kv_namespaces]]"
  echo "binding = \"CACHE\""
  echo "id = \"$KV_ID\""
fi

echo ""
echo "==> Done. Set GitHub Actions secrets:"
echo "   CLOUDFLARE_API_TOKEN"
echo "   CLOUDFLARE_ACCOUNT_ID"
echo "   NUXT_ADMIN_TOKEN (via wrangler pages secret put)"
