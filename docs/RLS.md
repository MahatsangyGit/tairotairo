# Row Level Security — Matrice des policies

Policies définies dans `supabase/migrations/20260629130000_011_rls_prisma_schema.sql`.

> **Obsolète :** `20260629120000_010_rls_enforcement.sql` (schéma snake_case). Voir [MIGRATIONS.md](./MIGRATIONS.md).

## Variables de session

| Variable | Valeur |
|----------|--------|
| `app.user_id` | ID connecté (vide = anonyme) |
| `app.user_role` | `CLIENT`, `PROVIDER`, `ADMIN` |
| `app.bypass_rls` | `true` pour auth, cron, notifications |

## Légende

| Symbole | Signification |
|---------|---------------|
| **Public** | Visiteur non connecté |
| **Self** | Utilisateur connecté (propre données) |
| **Peer** | Client ou prestataire en relation active |
| **Bypass** | Contexte système (`app.bypass_rls`) |
| **Admin** | Rôle `ADMIN` ou bypass |

---

## `users`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | Prestataires KYC ✓, clients avec demande ouverte ✓, auteurs d'avis ✓ | + Self, peers marketplace | + Self, peers | Tous |
| INSERT | — | — | — | Bypass (inscription) |
| UPDATE | — | Self | Self | Tous |
| DELETE | — | — | — | ✓ |

---

## `services`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | `available = true` | idem | + ses annonces (même off) | Tous |
| INSERT | — | — | Self (`provider_id`) | ✓ |
| UPDATE | — | — | Self | ✓ |
| DELETE | — | — | Self | ✓ |

---

## `service_requests`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | `open = true` | + ses demandes | + demandes où il a répondu | Tous |
| INSERT | — | Self (`client_id`) | — | ✓ |
| UPDATE | — | Self | Si réponse envoyée | ✓ |
| DELETE | — | Self | — | ✓ |

---

## `request_responses`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | Si demande ouverte | Ses demandes | Self | Tous |
| INSERT | — | — | Self sur demande ouverte | ✓ |
| UPDATE | — | Client de la demande | Self | ✓ |
| DELETE | — | — | Self | ✓ |

---

## `bookings`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | `client_id` = Self | `provider_id` = Self | Tous |
| INSERT | — | Self client | Self provider / bypass | ✓ |
| UPDATE | — | Participant | Participant | ✓ |
| DELETE | — | — | — | ✓ |

---

## `transactions`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | Via réservation | Via réservation | Tous |
| INSERT | — | — | — | Bypass / Admin |
| UPDATE | — | — | — | Bypass / Admin |

---

## `ProviderPayout`

Policies : `supabase/migrations/20260714100000_019_provider_payout_rls.sql`.

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | — | Self (`providerId`) | Tous |
| INSERT | — | — | — | Bypass / Admin |
| UPDATE | — | — | — | Bypass / Admin |
| DELETE | — | — | — | ✓ |

---

## `conversations` / `messages`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | Participant | Participant | Tous |
| INSERT | — | Ouvre fil (client) | Ouvre fil (provider) | ✓ |
| UPDATE | — | Participant | Participant | ✓ |
| Messages INSERT | — | `sender_id` = Self + participant | idem | ✓ |

---

## `notifications` / `push_subscriptions`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | Self | Self | Tous |
| INSERT | — | Self | Self | Bypass (notif tiers) |
| UPDATE/DELETE | — | Self | Self | ✓ |

---

## `reviews`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | ✓ (tous) | ✓ | ✓ | ✓ |
| INSERT | — | Après booking `COMPLETED` | — | ✓ |
| UPDATE/DELETE | — | — | — | ✓ |

---

## `provider_portfolio_items` / `portfolio_item_comments`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| Portfolio SELECT | Prestataire KYC approuvé | idem | + ses items | Tous |
| Portfolio CUD | — | — | Self | ✓ |
| Comments SELECT | ✓ | ✓ | ✓ | ✓ |
| Comments INSERT | — | Connecté | Connecté | ✓ |

---

## `provider_kyc_documents`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT | — | — | Self | ✓ (revue) |
| INSERT/UPDATE/DELETE | — | — | Self | ✓ |

---

## `provider_subscriptions` / `provider_subscription_payments`

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| Subscriptions SELECT | — | — | Self | ✓ |
| Subscriptions CUD | — | — | — | Bypass / Admin |
| Payments SELECT | — | — | Self | ✓ |
| Payments INSERT | — | — | Self | ✓ |
| Payments UPDATE | — | — | Self / Bypass | ✓ |

---

## `email_otps` / `password_reset_tokens`

Accès **Bypass uniquement** (inscription, OTP, mot de passe oublié).

---

## `NotificationOutbox`

File d’attente email/push (cron). Accès **Bypass / Admin** uniquement.

| Action | Public | CLIENT | PROVIDER | ADMIN |
|--------|--------|--------|----------|-------|
| SELECT / INSERT / UPDATE | — | — | — | Bypass / ✓ |
| DELETE | — | — | — | ✓ |

---

## Écosystème — ampindramo / ampianaro

Policies dans `supabase/migrations/20260720110000_023_ecosystem_rls.sql`.

### `EquipmentItem`

| Action | Public | Owner | ADMIN |
|--------|--------|-------|-------|
| SELECT | `PUBLISHED` | Self (tous statuts) | Tous |
| INSERT / UPDATE / DELETE | — | Self | ✓ |

### `RentalBooking` / `RentalTransaction` / `RentalPayout`

| Table | SELECT | Mutations |
|-------|--------|-----------|
| RentalBooking | Participants + Admin | Insert renter ; update participants ; delete admin |
| RentalTransaction | Participants + Admin | Bypass / Admin |
| RentalPayout | Owner + Admin | Bypass / Admin |

Helper : `app.is_rental_participant(rental_booking_id)`.

### `Course` / `CourseLesson`

| Action | Public | ADMIN |
|--------|--------|-------|
| SELECT | `PUBLISHED` (cours) / leçons du cours publié | Tous |
| CUD | — | ✓ |

La clé `videoKey` n’est jamais exposée publiquement ; lecture via `/api/learning/lessons/[id]/video` pour un compte client, prestataire ou admin connecté.

### `CourseEnrollment` / `LessonProgress`

| Action | Public | Self | ADMIN |
|--------|--------|------|-------|
| SELECT / INSERT / UPDATE / DELETE | — | Self (`userId`) | ✓ |

---

## Configuration

```sql
ALTER ROLE tairo_app PASSWORD 'votre_mot_de_passe';
```

```
DATABASE_URL=postgresql://mahatsangyraz@localhost:5432/ankino_db
```

> **Ne pas utiliser** `host` comme nom d'hôte — c'est un placeholder de documentation.
> En local : `localhost`. En production : l'hôte Supabase ou votre serveur.
