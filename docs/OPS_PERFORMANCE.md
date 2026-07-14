# Performance & pool ops (audit P1 / P2)

Ces points sont **à mesurer** avant d’ajouter des indexes ou de changer le pool. Pas d’optimisation aveugle.

## P1 — Recherche (ILIKE / contains)

1. Activer `pg_stat_statements` sur l’environnement cible.
2. Capturer les requêtes de `advanced-search` et `rating-sort-search` sous charge réaliste.
3. `EXPLAIN (ANALYZE, BUFFERS)` sur les top requêtes.
4. Seulement ensuite envisager `pg_trgm` GIN ou full-text.

Ne pas créer d’index trigram sans plan avant/après.

## P2 — Pool PostgreSQL + RLS

- L’app pose `set_config(..., false)` (session) dans [`app/lib/rls.ts`](../app/lib/rls.ts).
- Utiliser une connexion **directe** ou un pooler en mode **session** (pas transaction / port 6543 typique Supabase).
- Formule : `PG_POOL_MAX ≈ floor((max_connections - réserve) / instances) - marge`.
- Au boot production, un warning est émis si `DATABASE_URL` contient le port `6543` (pooler transactionnel probable).

## Signaux utiles

```sql
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```
