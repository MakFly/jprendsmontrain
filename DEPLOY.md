# Déploiement (Docker / VPS)

Stack : **Caddy** (TLS auto) → **web** (Next.js standalone) + **proxy** (Bun/Hono, + mirror).

## Prérequis
- Un VPS avec Docker + Docker Compose v2.
- Deux sous-domaines pointant (DNS A/AAAA) vers l'IP du VPS :
  - `app.example.com` → l'app
  - `api.example.com` → le proxy
- Ports **80** et **443** ouverts (Caddy obtient les certificats Let's Encrypt).

## 1. Configurer
```bash
git clone <repo> && cd pwa-max-sncf
cp .env.production.example .env
# éditer .env : domaines, SESSION_SECRET (openssl rand -hex 32),
# NEXT_PUBLIC_PROXY_URL=https://api.example.com, COOKIE_DOMAIN=.example.com, PWA_ORIGINS=https://app.example.com
```

> ⚠️ `NEXT_PUBLIC_PROXY_URL` est **inliné au build**. Si tu le changes, il faut **rebuild** le web (`docker compose build web`).

## 2. Build + lancer
```bash
docker compose build
docker compose up -d
docker compose logs -f         # vérifier le démarrage
```
- Web : `https://app.example.com`
- API : `https://api.example.com/health` → `{"status":"ok"}`

## 3. Mises à jour
```bash
git pull
docker compose build
docker compose up -d
```

## Notes
- **Sessions** : persistées dans le volume `proxy-data` (`/data/sessions.json`) — survivent aux redéploiements. Plafonnées à `MAX_SESSIONS` (5 par défaut).
- **Cookies cross-sous-domaine** : `COOKIE_DOMAIN=.example.com` + `COOKIE_SECURE=true` permettent à `app.*` d'appeler `api.*` avec le cookie `max-session` (même site, SameSite=Lax).
- **DataDome** : le proxy rejoue l'UA + cookies capturés ; l'IP du VPS doit rester cohérente avec celle de la capture de session (voir mémoire projet). En cas de 403/captcha, l'app affiche désormais une bannière de reconnexion.
- **Mirror login mobile** (optionnel) : décommenter les blocs `MIRROR_*` dans `Caddyfile` + `docker-compose.yml`, ajouter les sous-domaines DNS, et renseigner `NEXT_PUBLIC_MIRROR_URL` + `MIRROR_HOST` dans `.env`. La connexion standard fonctionne sans.
- **Lancer un seul service** : `docker compose up -d proxy` / `web`.

## Build/run d'une image isolée (sans compose)
```bash
docker build -f apps/proxy/Dockerfile -t max-sncf-proxy .
docker build -f apps/web/Dockerfile \
  --build-arg NEXT_PUBLIC_PROXY_URL=https://api.example.com \
  -t max-sncf-web .
```
