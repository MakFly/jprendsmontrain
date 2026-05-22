#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
RESULT="/tmp/pwa-proxy-test-result.txt"

cd "$(dirname "$0")/../apps/proxy"

# Use a different port for testing to avoid conflicts
export PORT=3334

# Start proxy in background
bun src/index.ts &
PROXY_PID=$!

# Wait for server to be ready
sleep 2

# Test health
echo "=== HEALTH CHECK ===" > "$RESULT"
curl -s http://localhost:3334/health >> "$RESULT" 2>&1
echo "" >> "$RESULT"

# Test auth init
echo "=== AUTH INIT ===" >> "$RESULT"
curl -s http://localhost:3334/auth/init >> "$RESULT" 2>&1
echo "" >> "$RESULT"

# Test auth status (should be unauthenticated)
echo "=== AUTH STATUS ===" >> "$RESULT"
curl -s http://localhost:3334/auth/status >> "$RESULT" 2>&1
echo "" >> "$RESULT"

echo "=== PROXY PID: $PROXY_PID ===" >> "$RESULT"

# Kill proxy
kill $PROXY_PID 2>/dev/null || true
