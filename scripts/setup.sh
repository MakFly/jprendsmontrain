#!/usr/bin/env bash
set -euo pipefail

RESULT_FILE="/tmp/pwa-max-sncf-setup-result.txt"
exec > "$RESULT_FILE" 2>&1

export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/.."

echo "=== BUN VERSION ==="
bun --version

echo "=== BUN INSTALL ==="
bun install

echo "=== LOCKFILE CHECK ==="
test -f bun.lock && echo "bun.lock exists" || echo "bun.lock missing"
test -d node_modules && echo "node_modules exists" || echo "node_modules missing"

echo "=== TYPECHECK ==="
cd apps/proxy
bunx tsc --noEmit 2>&1 || echo "TYPECHECK_FAILED"

echo "=== CREATE .ENV ==="
cd ../..
if [ ! -f apps/proxy/.env ]; then
  SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
  sed "s/change-me-to-a-random-32-char-string/$SECRET/" apps/proxy/.env.example > apps/proxy/.env
  echo ".env created with random secret"
else
  echo ".env already exists"
fi

echo "=== PORT ==="
echo "Proxy will run on port 3333"

echo "=== DONE ==="
