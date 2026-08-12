# Déploiement NGINX (VPS) — Tairo

Ce dossier contient la config NGINX de production (reverse proxy + TLS + WS + multi-instance).

## Fichier

- `deploy/nginx/tairo.conf`

## Prérequis VPS

- Ubuntu 22.04/24.04
- NGINX
- Node.js (build déjà faite : `dist/server.js`)
- 2 process Node en écoute :
  - `127.0.0.1:3001`
  - `127.0.0.1:3002`
- Redis (BullMQ, rate limit, realtime pub/sub)
- PostgreSQL (local ou managé)
- Object storage (S3/R2/MinIO ou Vercel Blob) — pas de médiathèque locale

## Variables côté app

Dans l’environnement des 2 process Node :

```bash
NODE_ENV=production
PORT=3001   # et 3002 sur la 2e instance
TRUSTED_PROXY_COUNT=1
```

## Installation (exemple)

```bash
sudo cp deploy/nginx/tairo.conf /etc/nginx/sites-available/tairo.conf
sudo ln -s /etc/nginx/sites-available/tairo.conf /etc/nginx/sites-enabled/tairo.conf
sudo nginx -t
sudo systemctl reload nginx
```

## TLS (Let’s Encrypt)

La conf suppose des certificats :

```bash
/etc/letsencrypt/live/tairo-ampio.mg/fullchain.pem
/etc/letsencrypt/live/tairo-ampio.mg/privkey.pem
```

Si l’hébergeur fournit un autre chemin, adapter `ssl_certificate*`.

## Notes

- Le CDN (prod réelle) gérera le cache des assets (`/_next/static`). Ici, NGINX ne fait pas de cache statique.
- Sticky sessions WebSocket : assurées par `ip_hash` dans l’upstream `tairo_app`.
- Uploads vidéo : prévus jusqu’à ~320 Mo (`client_max_body_size`) avec timeouts longs.
