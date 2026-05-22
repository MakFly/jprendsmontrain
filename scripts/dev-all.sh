#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
RESULT="/tmp/pwa-dev-start.txt"

cd "$(dirname "$0")/.."

# Kill existing processes on our ports
lsof -ti:3333 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start proxy in background
cd apps/proxy
bun src/index.ts &
PROXY_PID=$!
cd ../..

# Wait for proxy
sleep 2

# Test proxy health
echo "=== PROXY HEALTH ===" > "$RESULT"
curl -s http://localhost:3333/health >> "$RESULT" 2>&1
echo "" >> "$RESULT"
echo "proxy_pid=$PROXY_PID" >> "$RESULT"

# Start Next.js dev in background
cd apps/web
bunx next dev --port 3000 &
WEB_PID=$!
cd ../..

# Wait for Next.js
sleep 5

# Test web
echo "=== WEB CHECK ===" >> "$RESULT"
curl -s -o /dev/null -w "web_status=%{http_code}" http://localhost:3000/auth/login >> "$RESULT" 2>&1
echo "" >> "$RESULT"
echo "web_pid=$WEB_PID" >> "$RESULT"

# Test auth init via proxy
echo "=== AUTH INIT ===" >> "$RESULT"
curl -s http://localhost:3333/auth/init | head -c 200 >> "$RESULT" 2>&1
echo "" >> "$RESULT"

echo "=== SERVERS RUNNING ===" >> "$RESULT"
echo "Proxy: http://localhost:3333 (PID $PROXY_PID)" >> "$RESULT"
echo "Web:   http://localhost:3000 (PID $WEB_PID)" >> "$RESULT"
