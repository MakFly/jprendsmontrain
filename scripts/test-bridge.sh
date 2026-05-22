#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
RESULT="/tmp/pwa-bridge-test.txt"

cd "$(dirname "$0")/../apps/proxy"

lsof -ti:3333 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

bun src/index.ts &
PID=$!
sleep 2

echo "=== BRIDGE LOGIN PAGE ===" > "$RESULT"
curl -s -o /dev/null -w "status=%{http_code}, size=%{size_download}" http://localhost:3333/bridge/login >> "$RESULT"
echo "" >> "$RESULT"

echo "=== HEALTH ===" >> "$RESULT"
curl -s http://localhost:3333/health >> "$RESULT"
echo "" >> "$RESULT"

echo "pid=$PID" >> "$RESULT"
echo "=== BRIDGE URL: http://localhost:3333/bridge/login ===" >> "$RESULT"
