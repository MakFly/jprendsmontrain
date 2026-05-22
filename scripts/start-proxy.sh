#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"

cd "$(dirname "$0")/../apps/proxy"

# Kill any existing process on port 3333
lsof -ti:3333 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start proxy
exec bun --watch src/index.ts
