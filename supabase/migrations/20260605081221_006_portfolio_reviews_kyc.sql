/*
# Create portfolio, reviews, and KYC tables

## New Tables

### `reviews`
Client reviews of providers after a completed booking.
- `id` — CUID primary key
- `booking_id` — FK to bookings, unique (one review per booking)
- `author_id` — FK to users (the client writing the review)
- `target_id` — FK to users (the provider being reviewed)
- `rating` — integer 1–5
- `comment` — optional text review
- `created_at` — timestamp

### `provider_portfolio_items`
Portfolio images/entries showcasing a provider's past work.
- `id` — CUID primary key
- `provider_id` — FK to users
- `description` — caption or description of the work
- `stored_name` — filename in object storage
- `mime_type` — e.g. "image/jpeg"
- `size_bytes` — file size in bytes
- `sort_order` — display order (default 0)
- `created_at`, `updated_at` — timestamps

### `portfolio_item_comments`
Public comments left on portfolio items by any user.
- `id` — CUID primary key
- `item_id` — FK to provider_portfolio_items
- `author_id` — FK to users
- `body` — comment text
- `created_at` — timestamp

### `provider_kyc_documents`
KYC identity verification documents uploaded by providers.
- `id` — CUID primary key
- `user_id` — FK to users
- `type` — enum: CIN
- `cin_slot` — 1 or 2 (for CIN front/back)
- `stored_name` — filename in object storage
- `original_name` — original filename uploaded by user
- `mime_type` — document MIME type
- `size_bytes` — file size in bytes
- Unique constraint: one document per (user, type, cin_slot)

## Notes
- Reviews are immutable once written (no update policy).
- Portfolio sort_order enables manual reordering.
*/

-- ── Reviews ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id          text        PRIMARY KEY,
  booking_id  text        NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  author_id   text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_target_id_idx ON reviews (target_id);
CREATE INDEX IF NOT EXISTS reviews_author_id_idx ON reviews (author_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_update" ON reviews;
CREATE POLICY "reviews_update" ON reviews FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_delete" ON reviews;
CREATE POLICY "reviews_delete" ON reviews FOR DELETE TO anon, authenticated USING (true);

-- ── Provider Portfolio Items ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_portfolio_items (
  id            text        PRIMARY KEY,
  provider_id   text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description   text        NOT NULL,
  stored_name   text        NOT NULL,
  mime_type     text        NOT NULL,
  size_bytes    integer     NOT NULL,
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_items_provider_sort_idx ON provider_portfolio_items (provider_id, sort_order);

ALTER TABLE provider_portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_items_select" ON provider_portfolio_items;
CREATE POLICY "portfolio_items_select" ON provider_portfolio_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "portfolio_items_insert" ON provider_portfolio_items;
CREATE POLICY "portfolio_items_insert" ON provider_portfolio_items FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "portfolio_items_update" ON provider_portfolio_items;
CREATE POLICY "portfolio_items_update" ON provider_portfolio_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "portfolio_items_delete" ON provider_portfolio_items;
CREATE POLICY "portfolio_items_delete" ON provider_portfolio_items FOR DELETE TO anon, authenticated USING (true);

-- ── Portfolio Item Comments ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_item_comments (
  id          text        PRIMARY KEY,
  item_id     text        NOT NULL REFERENCES provider_portfolio_items(id) ON DELETE CASCADE,
  author_id   text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_comments_item_created_at_idx ON portfolio_item_comments (item_id, created_at);

ALTER TABLE portfolio_item_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_comments_select" ON portfolio_item_comments;
CREATE POLICY "portfolio_comments_select" ON portfolio_item_comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "portfolio_comments_insert" ON portfolio_item_comments;
CREATE POLICY "portfolio_comments_insert" ON portfolio_item_comments FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "portfolio_comments_update" ON portfolio_item_comments;
CREATE POLICY "portfolio_comments_update" ON portfolio_item_comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "portfolio_comments_delete" ON portfolio_item_comments;
CREATE POLICY "portfolio_comments_delete" ON portfolio_item_comments FOR DELETE TO anon, authenticated USING (true);

-- ── Provider KYC Documents ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provider_kyc_documents (
  id            text                PRIMARY KEY,
  user_id       text                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          kyc_document_type   NOT NULL,
  cin_slot      integer             NOT NULL DEFAULT 0,
  stored_name   text                NOT NULL,
  original_name text                NOT NULL,
  mime_type     text                NOT NULL,
  size_bytes    integer             NOT NULL,
  created_at    timestamptz         NOT NULL DEFAULT now(),

  UNIQUE (user_id, type, cin_slot)
);

CREATE INDEX IF NOT EXISTS kyc_documents_user_id_idx ON provider_kyc_documents (user_id);

ALTER TABLE provider_kyc_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kyc_documents_select" ON provider_kyc_documents;
CREATE POLICY "kyc_documents_select" ON provider_kyc_documents FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "kyc_documents_insert" ON provider_kyc_documents;
CREATE POLICY "kyc_documents_insert" ON provider_kyc_documents FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "kyc_documents_update" ON provider_kyc_documents;
CREATE POLICY "kyc_documents_update" ON provider_kyc_documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kyc_documents_delete" ON provider_kyc_documents;
CREATE POLICY "kyc_documents_delete" ON provider_kyc_documents FOR DELETE TO anon, authenticated USING (true);
