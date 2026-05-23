# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Build with:
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_PROXY_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_MIRROR_URL=https://m.example.com -t max-sncf-web .

# ── Install workspace dependencies (layer cached on the lockfile) ────────
FROM oven/bun:1.3.14 AS deps
WORKDIR /app
COPY package.json bun.lock turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/proxy/package.json apps/proxy/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN bun install --frozen-lockfile

# ── Build the Next.js app into a standalone server ──────────────────────
FROM oven/bun:1.3.14 AS build
WORKDIR /app
# NEXT_PUBLIC_* are inlined at BUILD time, so they MUST be provided here.
ARG NEXT_PUBLIC_PROXY_URL
ARG NEXT_PUBLIC_MIRROR_URL
ENV NEXT_PUBLIC_PROXY_URL=$NEXT_PUBLIC_PROXY_URL \
    NEXT_PUBLIC_MIRROR_URL=$NEXT_PUBLIC_MIRROR_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN cd apps/web && bun run build

# ── Minimal runtime image ───────────────────────────────────────────────
FROM oven/bun:1.3.14-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3020 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# Standalone output mirrors the monorepo layout under .next/standalone.
COPY --from=build --chown=bun:bun /app/apps/web/.next/standalone ./
COPY --from=build --chown=bun:bun /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=bun:bun /app/apps/web/public ./apps/web/public
USER bun
EXPOSE 3020
CMD ["bun", "apps/web/server.js"]
