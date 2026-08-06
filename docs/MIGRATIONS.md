# Migrations base de données

## Source de vérité

Les migrations SQL versionnées dans **`supabase/migrations/`** sont la source de vérité du schéma PostgreSQL.

Le client Prisma (`prisma/` multi-fichiers → `app/generated/prisma`) reflète ce schéma.

Organisation du schéma Prisma (lecture seule, sans impact DB) :

```
prisma/
  schema.prisma          # generator + datasource
  models/
    user.prisma          # User, KYC, auth tokens, abonnements
    listings.prisma      # Service, ServiceRequest, RequestResponse
    bookings.prisma      # Booking, Transaction, ProviderPayout
    messaging.prisma     # Conversation, Message
    notifications.prisma # Notification, PushSubscription
    portfolio.prisma     # Portfolio, Review
```

`prisma.config.ts` pointe `schema: "prisma"` (répertoire) pour que Prisma 7 fusionne tous les `.prisma`.

> **Migrations :** ne pas utiliser `prisma migrate`. La source de vérité reste `supabase/migrations/`. Le chemin `prisma/migrations` dans la config Prisma est volontairement non utilisé (compatibilité CLI uniquement).

## Neon sur Vercel

Les variables de connexion créées par l'intégration Neon sont marquées
**Sensitive**. `vercel env pull` écrit donc `[SENSITIVE]` localement au lieu de
la chaîne de connexion réelle.

Le script `npm run db:migrate:neon` est exécuté par `vercel-build`, là où
`DATABASE_URL_UNPOOLED` est réellement injectée. Il :

1. synchronise le schéma Prisma sans accepter de suppression de données ;
2. ignore les migrations historiques `001` à `010` en snake_case ;
3. applique dans l'ordre les migrations actives `011+` ;
4. enregistre leur état dans `app."_TairoMigration"` ;
5. vérifie les tables principales et les politiques RLS.

L'exécution est protégée par un verrou PostgreSQL et peut être rejouée sans
réappliquer les migrations déjà enregistrées.

Après modification d'une migration :

1. Appliquer les fichiers SQL dans l'ordre (outil Supabase CLI, `psql`, ou pipeline CI).
2. Synchroniser le schéma Prisma si nécessaire : `npx prisma db pull`
3. Régénérer le client : `npm run prisma:generate`

## Conventions

| Élément | Convention active |
|---------|-------------------|
| Tables | PascalCase Prisma (`"User"`, `"Service"`, …) |
| Colonnes | camelCase (`"clientId"`, `"createdAt"`, …) |
| RLS | Migration `20260629130000_011_rls_prisma_schema.sql` |

> **Obsolète :** `20260629120000_010_rls_enforcement.sql` cible un schéma snake_case Supabase historique. Ne pas appliquer sur une base Prisma.

## Scripts manuels (`scripts/`)

Les fichiers `.sql` dans `scripts/` sont des opérations ponctuelles (backfill, sync). Ils ne remplacent pas les migrations versionnées. Documenter toute exécution manuelle dans les notes de déploiement.

## Nouvelle migration

1. Créer `supabase/migrations/YYYYMMDDHHMMSS_NNN_description.sql`
2. Utiliser `IF NOT EXISTS` pour les index et objets idempotents
3. Mettre à jour le fichier domaine sous `prisma/models/` (`@@index`, enums, relations)
4. Incrémenter `PRISMA_CLIENT_GENERATION` dans `app/lib/prisma.ts` si le schéma client change de façon incompatible en dev
