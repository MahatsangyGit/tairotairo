# Tairo ampio

Marketplace de services à Madagascar — Next.js 16 (App Router) avec serveur Node custom et WebSocket messagerie.

## Prérequis

- Node.js 20+
- PostgreSQL 16+
- Redis 8 (recommandé en production ; licence **RSALv2** — usage backend self-hosted, pas Redis-as-a-service)

## Développement local

```bash
cp .env.example .env
# Éditer .env (DATABASE_URL, JWT_SECRET, …)

npm install
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000). Le WebSocket messagerie écoute sur `ws://localhost:3000/ws/messaging`.

## Production (VPS)

### Build

```bash
npm ci
npm run build        # next build
npm run build:server # bundle server.ts + worker Sharp → dist/
npm start            # NODE_ENV=production node dist/server.js
npm run start:worker:images  # process Sharp séparé (obligatoire en prod)
```

> **Important :** en production, seul le serveur Node custom (`npm start` / `node dist/server.js`) est supporté. Il pose CORS, CSRF, les limites de body, le contexte RLS et le WebSocket. `next start` seul est refusé au démarrage.
>
> Le worker d’images (`start:worker:images`) isole Sharp du process HTTP via BullMQ/Redis — adapté à un VPS ~4 Go RAM (concurrency 1).

### Docker Compose

```bash
export JWT_SECRET="votre-secret-jwt-32-caracteres-minimum"
export CRON_SECRET="votre-secret-cron"
docker compose up --build
```

Healthcheck : `GET /api/health`

Compose et CI utilisent `redis:8-alpine`, sous **RSALv2** (marketplace self-hosted : Redis n’est pas offert comme service). `REDIS_URL` et le client `ioredis` / BullMQ restent inchangés.

Sur un VPS déjà en Redis 7 **avec** persistance : sauvegarder `dump.rdb` / AOF, puis remplacer le binaire. Redis 8 lit un dump 7 ; un retour à 7 n’est pas possible sans vider les données. Compose n’a pas de volume Redis (état jetable).

### Cron abonnements

Sur le VPS, planifier le script npm :

```bash
npm run cron:expire-subscriptions
npm run cron:cleanup-tokens
```

(`vercel.json` peut rester pour un déclencheur externe optionnel ; le cron principal est côté serveur.)

## Migrations base de données

Voir [docs/MIGRATIONS.md](docs/MIGRATIONS.md). Source de vérité : `supabase/migrations/`.

## Tests

```bash
npm run test        # Vitest (unitaires + intégration)
npm run test:e2e    # Playwright
```
