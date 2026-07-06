# Tairo ampio

Marketplace de services à Madagascar — Next.js 16 (App Router) avec serveur Node custom et WebSocket messagerie.

## Prérequis

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (recommandé en production)

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
npm run build:server # bundle server.ts → dist/server.js
npm start            # NODE_ENV=production node dist/server.js
```

### Docker Compose

```bash
export JWT_SECRET="votre-secret-jwt-32-caracteres-minimum"
export CRON_SECRET="votre-secret-cron"
docker compose up --build
```

Healthcheck : `GET /api/health`

### Cron abonnements

Sur le VPS, planifier le script npm :

```bash
npm run cron:expire-subscriptions
```

(`vercel.json` peut rester pour un déclencheur externe optionnel ; le cron principal est côté serveur.)

## Migrations base de données

Voir [docs/MIGRATIONS.md](docs/MIGRATIONS.md). Source de vérité : `supabase/migrations/`.

## Tests

```bash
npm run test        # Vitest (unitaires + intégration)
npm run test:e2e    # Playwright
```
