# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). The proxy runs TypeScript directly via
# Bun — no build step. Build with:
#   docker build -f apps/proxy/Dockerfile -t max-sncf-proxy .

# ── Install workspace dependencies (layer cached on the lockfile) ────────
FROM oven/bun:1.3.14-slim AS deps
WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/proxy/package.json apps/proxy/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

# ── Runtime ─────────────────────────────────────────────────────────────
FROM oven/bun:1.3.14-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3333 \
    MIRROR_PORT=3344 \
    MIRROR_IDP_PORT=3345 \
    SESSION_STORE_FILE=/data/sessions.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/proxy/node_modules ./apps/proxy/node_modules
COPY package.json bun.lock ./
COPY packages/shared packages/shared
COPY apps/proxy apps/proxy
# Persisted session store lives on a mounted volume.
RUN mkdir -p /data && chown bun:bun /data
USER bun
EXPOSE 3333 3344 3345
# Liveness via the proxy's /health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "apps/proxy/src/index.ts"]
