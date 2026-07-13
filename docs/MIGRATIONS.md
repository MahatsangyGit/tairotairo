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
