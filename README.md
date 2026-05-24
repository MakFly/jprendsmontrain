# MAX SNCF PWA

> An open-source Progressive Web App for managing your **MAX Actif TGV INOUI** subscription — view trips, reservations, invoices, and subscription details from any device.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/deploy-Docker-2496ED?logo=docker)](https://docker.com)

---

## What is this?

SNCF offers the **MAX Actif** unlimited TGV subscription but provides no dedicated mobile app — only a website that is cumbersome on phones. This project fills the gap with a fast, installable PWA and a local proxy API that authenticates against the official SNCF backend on your behalf.

### Key Features

- **Dashboard** — upcoming trips, QR codes, subscription status at a glance
- **Trip history** — past journeys with full details
- **Reservations** — view and access booking details
- **Invoices** — download monthly invoices
- **Subscription management** — plan details and renewal info
- **Search** — find train availability
- **Installable PWA** — add to home screen on iOS/Android, works offline-first
- **Dark mode** — full light/dark theme support
- **Mobile-first** — designed for phones, adapts to tablets and desktops
- **Privacy-first** — self-hosted, no tracking, no third-party analytics
- **GDPR compliant** — cookie consent banner, privacy policy page

---

## Architecture

```
╔══════════════ Client ═══════════════╗
║  ┌────────────────────────────────┐  ║
║  │   Next.js 15 PWA (React 19)   │  ║
║  │   TailwindCSS + shadcn/ui     │  ║
║  │   Port 3020                    │  ║
║  └───────────────┬────────────────┘  ║
╚══════════════════│═══════════════════╝
                   │ HTTP/JSON
╔══════════════════▼═══════════════════╗
║          Proxy API (Hono/Bun)        ║
║  ┌─────────────────────────────────┐ ║
║  │  OAuth2 session management      │ ║
║  │  Rate limiting + CORS           │ ║
║  │  DataDome bypass                │ ║
║  │  Port 3333                      │ ║
║  └───────────────┬─────────────────┘ ║
╚══════════════════│═══════════════════╝
                   │ HTTPS
                   ▼
         ┌─────────────────┐
         │  SNCF Backend   │
         │  (maxactif API) │
         └─────────────────┘
```

**Production** adds Caddy as a reverse proxy for automatic TLS via Let's Encrypt.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript strict |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| State | Zustand, TanStack Query |
| Animations | Motion (Framer Motion) |
| Proxy API | Hono, Bun runtime |
| Auth | OAuth2 (PKCE) via SNCF, session cookies |
| Monorepo | Turborepo, Bun workspaces |
| Deploy | Docker Compose, Caddy (auto-TLS) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- A valid MAX Actif SNCF account

### Install & Run

```bash
git clone https://github.com/MakFly/pwa-max-sncf.git
cd pwa-max-sncf

# Install dependencies
make install

# Start both proxy (port 3333) and web (port 3020)
make dev
```

Open [http://localhost:3020](http://localhost:3020) and log in with your SNCF credentials.

### Environment Variables

Copy `.env.example` to `.env` — sensible defaults are provided:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Proxy API port | `3333` |
| `SNCF_BACKEND_URL` | SNCF upstream API | `https://www.maxactif-tgvinoui.sncf` |
| `SESSION_SECRET` | Cookie encryption key | (must change in prod) |
| `PWA_ORIGIN` | Allowed CORS origin | `http://localhost:3020` |
| `APP_VERSION` | Spoofed app version header | `2.54.2` |

---

## Available Commands

```bash
make install      # Install deps + create .env
make dev          # Run proxy + web (Turborepo)
make dev-proxy    # Run proxy only
make dev-web      # Run web only
make typecheck    # Type-check all workspaces
make build        # Build all workspaces
make kill         # Kill processes on dev ports
make clean        # Remove node_modules + .next + .turbo
```

---

## Production Deployment

The project ships with a Docker Compose stack (Caddy + Web + Proxy) ready for any VPS.

```bash
cp .env.production.example .env
# Edit .env: set domains, SESSION_SECRET, NEXT_PUBLIC_PROXY_URL, etc.

docker compose build
docker compose up -d
```

Caddy handles TLS certificates automatically. See [DEPLOY.md](DEPLOY.md) for the full guide.

### Requirements

- Docker + Docker Compose v2
- Two DNS A records pointing to your VPS (`app.example.com`, `api.example.com`)
- Ports 80 and 443 open

---

## Project Structure

```
pwa-max-sncf/
├── apps/
│   ├── proxy/          # Hono API proxy (Bun)
│   └── web/            # Next.js 15 PWA
├── packages/
│   └── shared/         # Shared types & utilities
├── docker-compose.yml  # Production stack
├── Caddyfile           # Reverse proxy config
├── Makefile            # Dev commands
└── turbo.json          # Turborepo pipeline
```

---

## Security

- All traffic to SNCF goes through your self-hosted proxy — credentials never touch third parties
- Sessions are encrypted with `SESSION_SECRET` and stored server-side
- CORS is locked to your configured origins
- Rate limiting on all proxy endpoints
- Secure cookies with `HttpOnly`, `SameSite=Lax`, optional `Secure` flag
- OWASP-hardened headers (CSP, HSTS, X-Frame-Options)
- No analytics, no tracking, no telemetry

---

## Disclaimer

This project is **not affiliated with, endorsed by, or associated with SNCF** in any way. It is an independent, open-source tool built for personal use. Use it at your own risk and in compliance with SNCF's terms of service.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## License

[MIT](LICENSE)

---

## Keywords

SNCF, MAX Actif, TGV INOUI, PWA, Progressive Web App, train subscription, French railway, self-hosted, Next.js, Hono, Bun, Docker, open-source, mobile-first, offline-first
