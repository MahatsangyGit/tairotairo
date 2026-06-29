# Row Level Security (PostgreSQL)

L'application utilise un JWT custom (cookie `token`), pas Supabase Auth. Le RLS est appliqué via des variables de session PostgreSQL, définies automatiquement à chaque requête HTTP par `server.ts`.

## Variables de session

| Variable | Description |
|----------|-------------|
| `app.user_id` | ID utilisateur connecté (vide = anonyme) |
| `app.user_role` | `CLIENT`, `PROVIDER` ou `ADMIN` |
| `app.bypass_rls` | `true` pour auth, cron et écritures système |

## Configuration

1. **Appliquer la migration** `supabase/migrations/20260629120000_010_rls_enforcement.sql` sur votre base PostgreSQL.

2. **Créer le mot de passe du rôle applicatif** (une fois) :
   ```sql
   ALTER ROLE tairo_app PASSWORD 'votre_mot_de_passe';
   ```

3. **Mettre à jour `DATABASE_URL`** pour utiliser le rôle `tairo_app` (pas un superutilisateur) :
   ```
   DATABASE_URL=postgresql://tairo_app:votre_mot_de_passe@host:5432/dbname
   ```

4. **Migrations** : utilisez un rôle propriétaire des tables (ex. `postgres`) via `DATABASE_URL_MIGRATE` ou la CLI Supabase — le rôle `tairo_app` n'a pas les droits DDL.

## Contexte RLS dans le code

- **Requêtes HTTP** : contexte résolu automatiquement dans `server.ts` (JWT cookie + chemins bypass auth/cron).
- **Écritures système** (notifications, activation abonnement) : `withBypassRls()` dans `app/lib/rls.ts`.
- **Lectures publiques** (accueil) : `withAnonymousRls()` si appelé hors requête HTTP.

## Chemins bypass (sans utilisateur)

- `/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/email/*`
- `/api/cron/*`
