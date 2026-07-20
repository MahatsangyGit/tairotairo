# Sous-domaines écosystème Tairo (ampindramo / ampianaro)

Monolithe modulaire : un seul process Node (`server.ts`) sert Tairo ampio,
Tairo ampindramo et Tairo ampianaro. Le routage se fait par en-tête `Host`
dans [`proxy.ts`](../proxy.ts).

## Variables d'environnement

| Variable | Exemple | Rôle |
|----------|---------|------|
| `NEXT_PUBLIC_APP_URL` | `https://tairo-ampio.mg` | Origine marketplace (CORS, e-mails) |
| `AUTH_COOKIE_DOMAIN` | `.tairo-ampio.mg` | Cookie SSO partagé (absent en local) |
| `RENTAL_HOST` | `ampindramo.tairo-ampio.mg` | Host ampindramo |
| `LEARNING_HOST` | `ampianaro.tairo-ampio.mg` | Host ampianaro |
| `CORS_ALLOWED_ORIGINS` | `https://ampindramo…,https://ampianaro…` | Origines API cross-origin |
| `RENTAL_ENABLED` / `LEARNING_ENABLED` | `true` | Flags d'activation |

Sans `RENTAL_HOST` / `LEARNING_HOST`, les pages restent accessibles en chemins
`/ampindramo/*` et `/ampianaro/*` sur l'origine principale (pratique en dev).

## DNS

```
tairo-ampio.mg                A / CNAME  → serveur
ampindramo.tairo-ampio.mg     A / CNAME  → même serveur
ampianaro.tairo-ampio.mg      A / CNAME  → même serveur
```

Certificat wildcard `*.tairo-ampio.mg` recommandé (Let's Encrypt).

## Nginx (extrait)

```nginx
upstream tairo_node {
  server 127.0.0.1:3000;
  keepalive 32;
}

# Marketplace
server {
  listen 443 ssl http2;
  server_name tairo-ampio.mg www.tairo-ampio.mg;
  # ssl_certificate … wildcard ou SAN
  client_max_body_size 320m;  # vidéos ampianaro

  location / {
    proxy_pass http://tairo_node;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}

# Ampindramo + Ampianaro — même upstream
server {
  listen 443 ssl http2;
  server_name ampindramo.tairo-ampio.mg ampianaro.tairo-ampio.mg;
  client_max_body_size 320m;

  location / {
    proxy_pass http://tairo_node;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Comportement proxy

1. `Host = RENTAL_HOST` → rewrite interne vers `/ampindramo…`
2. `Host = LEARNING_HOST` → rewrite interne vers `/ampianaro…`
3. En production, accès à `/ampindramo/*` sur le domaine principal → redirect 308
   vers le sous-domaine dédié (idem ampianaro)
4. Les routes `/api/*` restent partagées (pas de rewrite Host)

## SSO

Avec `AUTH_COOKIE_DOMAIN=.tairo-ampio.mg`, les cookies `token` et `csrf-token`
sont envoyés à tous les sous-domaines. `SameSite=Lax` convient aux navigations
top-level entre sous-domaines du même domaine enregistrable.
