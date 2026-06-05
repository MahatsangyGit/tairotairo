/*
# Create messaging and notifications tables

## New Tables

### `conversations`
A conversation thread between exactly one client and one provider.
Unique constraint ensures there is only one thread per (client, provider) pair.
- `id` — CUID primary key
- `client_id` — FK to users
- `provider_id` — FK to users
- `created_at`, `updated_at` — timestamps (updated_at used for ordering inbox)

### `messages`
Individual messages within a conversation, supporting both plain text and price offer negotiation.
- `id` — CUID primary key
- `conversation_id` — FK to conversations
- `sender_id` — FK to users (who sent this message)
- `body` — message text
- `kind` — enum: TEXT / PRICE_OFFER
- `offer_price` — price proposed (only when kind = PRICE_OFFER)
- `offer_status` — enum: PENDING / ACCEPTED / SUPERSEDED (only when kind = PRICE_OFFER)
- `read_at` — when the recipient read the message (nullable)
- `request_response_id` — optional FK to request_responses (contextual link)
- `service_id` — optional FK to services (contextual link for service-based offers)
- `created_at` — timestamp

### `notifications`
In-app notification records per user.
- `id` — CUID primary key
- `user_id` — FK to users
- `type` — notification type string (e.g. "booking_confirmed")
- `title` — notification title
- `body` — notification body text
- `link` — optional URL to navigate to on click
- `read` — whether the user has read it (default false)
- `created_at` — timestamp

### `push_subscriptions`
Web Push API subscription records (for browser push notifications).
- `id` — CUID primary key
- `user_id` — FK to users
- `endpoint` — unique Push API endpoint URL
- `p256dh` — public key for encryption
- `auth` — auth secret for encryption
- `created_at` — timestamp

## Indexes
Performance indexes on foreign keys and frequently queried columns.
*/

-- ── Conversations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id          text        PRIMARY KEY,
  client_id   text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (client_id, provider_id)
);

CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_client_id_idx ON conversations (client_id);
CREATE INDEX IF NOT EXISTS conversations_provider_id_idx ON conversations (provider_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON conversations;
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "conversations_delete" ON conversations;
CREATE POLICY "conversations_delete" ON conversations FOR DELETE TO anon, authenticated USING (true);

-- ── Messages ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id                    text                PRIMARY KEY,
  conversation_id       text                NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id             text                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  body                  text                NOT NULL,
  kind                  message_kind        NOT NULL DEFAULT 'TEXT',
  offer_price           double precision,
  offer_status          price_offer_status,
  read_at               timestamptz,
  request_response_id   text                REFERENCES request_responses(id) ON DELETE SET NULL,
  service_id            text                REFERENCES services(id) ON DELETE SET NULL,
  created_at            timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS messages_request_response_id_offer_status_idx ON messages (request_response_id, offer_status);
CREATE INDEX IF NOT EXISTS messages_service_id_offer_status_idx ON messages (service_id, offer_status);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "messages_delete" ON messages;
CREATE POLICY "messages_delete" ON messages FOR DELETE TO anon, authenticated USING (true);

-- ── Notifications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text        NOT NULL,
  title       text        NOT NULL,
  body        text        NOT NULL,
  link        text,
  read        boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_read_created_at_idx ON notifications (user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- ── Push Subscriptions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          text        PRIMARY KEY,
  user_id     text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL UNIQUE,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_select" ON push_subscriptions;
CREATE POLICY "push_subscriptions_select" ON push_subscriptions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "push_subscriptions_insert" ON push_subscriptions;
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions_update" ON push_subscriptions;
CREATE POLICY "push_subscriptions_update" ON push_subscriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "push_subscriptions_delete" ON push_subscriptions;
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions FOR DELETE TO anon, authenticated USING (true);
