#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
RESULT="/tmp/pwa-dev-test.txt"

cd "$(dirname "$0")/.."

# Kill existing
lsof -ti:3333 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3020 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start proxy
cd apps/proxy
bun src/index.ts &
PROXY_PID=$!
cd ../..
sleep 2

# Start web
cd apps/web
bunx next dev --port 3020 &
WEB_PID=$!
cd ../..
sleep 8

echo "=== RESULTS ===" > "$RESULT"

# Test proxy
echo "proxy_health: $(curl -s http://localhost:3333/health)" >> "$RESULT"

# Test web
echo "web_login: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3020/auth/login)" >> "$RESULT"
echo "web_home: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3020/)" >> "$RESULT"

# Test auth
echo "auth_init: $(curl -s http://localhost:3333/auth/init | head -c 100)" >> "$RESULT"

echo "proxy_pid=$PROXY_PID" >> "$RESULT"
echo "web_pid=$WEB_PID" >> "$RESULT"
echo "=== DONE ===" >> "$RESULT"

# Don't kill — leave servers running
