/*
# Create bookings and transactions tables

## New Tables

### `bookings`
A confirmed or pending appointment between a client and provider.
A booking is created either from a direct service booking or from an accepted request response.

- `id` — CUID primary key
- `client_id` — FK to users (client who booked)
- `provider_id` — FK to users (provider fulfilling the booking)
- `service_id` — optional FK to services (null if sourced from a request)
- `request_response_id` — optional FK to request_responses, unique (null if direct service booking)
- `status` — enum: PENDING / CONFIRMED / COMPLETED / CANCELLED
- `date` — scheduled date/time
- `slot_start`, `slot_end` — optional time slot strings (HH:MM)
- Display snapshot columns (`display_*`) — frozen copy of service/request details
  for rendering even after the source record is deleted:
  - `display_title`, `display_price`, `display_category`, `display_location`
  - `display_source` — "service" or "request"
  - `display_target_id` — ID of the source service or request
- `created_at`, `updated_at` — timestamps

### `transactions`
Payment record for a booking (mobile money: Orange Money, MVola, Airtel Money).
- `id` — CUID primary key
- `booking_id` — FK to bookings, unique (one transaction per booking)
- `amount` — payment amount
- `currency` — default "MGA" (Malagasy Ariary)
- `status` — enum: PENDING / SUCCESS / FAILED
- `payment_method` — enum: ORANGE_MONEY / MVOLA / AIRTEL_MONEY
- `reference_id` — external payment reference (optional)
- `created_at`, `updated_at` — timestamps

## Notes
- A booking cannot be sourced from both a service and a request response simultaneously;
  the application layer enforces mutual exclusivity.
- The display snapshot prevents orphaned bookings from losing their display data.
*/

-- ── Bookings ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id                    text              PRIMARY KEY,
  client_id             text              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_id           text              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  service_id            text              REFERENCES services(id) ON DELETE SET NULL,
  request_response_id   text              UNIQUE REFERENCES request_responses(id) ON DELETE SET NULL,
  status                booking_status    NOT NULL DEFAULT 'PENDING',
  date                  timestamptz       NOT NULL,
  slot_start            text,
  slot_end              text,
  -- Display snapshot (frozen copy in case source is deleted)
  display_title         text,
  display_price         double precision,
  display_category      text,
  display_location      text,
  display_source        text,
  display_target_id     text,
  created_at            timestamptz       NOT NULL DEFAULT now(),
  updated_at            timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_client_id_idx ON bookings (client_id);
CREATE INDEX IF NOT EXISTS bookings_provider_id_idx ON bookings (provider_id);
CREATE INDEX IF NOT EXISTS bookings_service_id_idx ON bookings (service_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status);
CREATE INDEX IF NOT EXISTS bookings_date_idx ON bookings (date);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "bookings_delete" ON bookings;
CREATE POLICY "bookings_delete" ON bookings FOR DELETE TO anon, authenticated USING (true);

-- ── Transactions ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id              text                PRIMARY KEY,
  booking_id      text                NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  amount          double precision    NOT NULL,
  currency        text                NOT NULL DEFAULT 'MGA',
  status          transaction_status  NOT NULL DEFAULT 'PENDING',
  payment_method  payment_method      NOT NULL,
  reference_id    text,
  created_at      timestamptz         NOT NULL DEFAULT now(),
  updated_at      timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_booking_id_idx ON transactions (booking_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions (status);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete" ON transactions FOR DELETE TO anon, authenticated USING (true);
