#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
cd "$(dirname "$0")/../apps/proxy"
bunx tsc --noEmit > /tmp/typecheck-result.txt 2>&1
echo "EXIT=$?" >> /tmp/typecheck-result.txt
