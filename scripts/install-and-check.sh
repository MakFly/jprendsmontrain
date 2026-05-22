#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
RESULT="/tmp/pwa-install-check.txt"

cd "$(dirname "$0")/.."

echo "=== BUN INSTALL ===" > "$RESULT"
bun install >> "$RESULT" 2>&1
echo "" >> "$RESULT"

echo "=== PROXY TYPECHECK ===" >> "$RESULT"
cd apps/proxy
bunx tsc --noEmit >> "$RESULT" 2>&1
echo "proxy exit=$?" >> "$RESULT"
cd ../..

echo "=== WEB TYPECHECK ===" >> "$RESULT"
cd apps/web
bunx tsc --noEmit >> "$RESULT" 2>&1
echo "web exit=$?" >> "$RESULT"
cd ../..

echo "=== DONE ===" >> "$RESULT"
