/*
# Create services and service requests tables

## New Tables

### `services`
Provider service listings visible on the marketplace.
- `id` — CUID primary key
- `title` — service title
- `description` — detailed description
- `price` — price in Ariary (double precision)
- `category` — service category matching the app's predefined list
- `location` — city/area where service is offered
- `available` — whether listing is active (default true)
- `featured_on_homepage`, `featured_on_homepage_at` — admin spotlight flags
- `provider_id` — FK to users (the provider who owns this listing)
- `created_at`, `updated_at` — timestamps

### `service_requests`
Client requests for a service (inverse of services — clients post, providers respond).
- `id` — CUID primary key
- `title` — request title
- `description` — what the client needs
- `budget` — client's budget in Ariary
- `category` — category of service needed
- `location` — where service is needed
- `desired_date` — when the client wants the service
- `desired_slot_start`, `desired_slot_end` — time slot preference (HH:MM strings)
- `open` — whether the request is still accepting proposals (default true)
- `client_id` — FK to users (the client who posted this)
- `created_at`, `updated_at` — timestamps

### `request_responses`
Provider proposals in response to a service request.
- `id` — CUID primary key
- `request_id` — FK to service_requests
- `provider_id` — FK to users (the responding provider)
- `message` — proposal message text
- `proposed_price` — price proposed by provider (optional)
- `status` — enum: PENDING / ACCEPTED / REJECTED / WITHDRAWN / COMPLETED
- Unique constraint: one response per (request, provider) pair

## Indexes
- services: provider_id, category, available, featured
- service_requests: client_id, category, open
- request_responses: request_id, provider_id, status
*/

-- ── Services ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS services (
  id                        text              PRIMARY KEY,
  title                     text              NOT NULL,
  description               text              NOT NULL,
  price                     double precision  NOT NULL,
  category                  text              NOT NULL,
  location                  text              NOT NULL,
  available                 boolean           NOT NULL DEFAULT true,
  featured_on_homepage      boolean           NOT NULL DEFAULT false,
  featured_on_homepage_at   timestamptz,
  provider_id               text              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at                timestamptz       NOT NULL DEFAULT now(),
  updated_at                timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_provider_id_idx ON services (provider_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON services (category);
CREATE INDEX IF NOT EXISTS services_available_idx ON services (available) WHERE available = true;
CREATE INDEX IF NOT EXISTS services_featured_idx ON services (featured_on_homepage) WHERE featured_on_homepage = true;
CREATE INDEX IF NOT EXISTS services_created_at_idx ON services (created_at DESC);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_select" ON services;
CREATE POLICY "services_select" ON services FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "services_insert" ON services;
CREATE POLICY "services_insert" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "services_update" ON services;
CREATE POLICY "services_update" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "services_delete" ON services;
CREATE POLICY "services_delete" ON services FOR DELETE TO anon, authenticated USING (true);

-- ── Service Requests ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_requests (
  id                  text              PRIMARY KEY,
  title               text              NOT NULL,
  description         text              NOT NULL,
  budget              double precision  NOT NULL,
  category            text              NOT NULL,
  location            text              NOT NULL,
  desired_date        timestamptz,
  desired_slot_start  text,
  desired_slot_end    text,
  open                boolean           NOT NULL DEFAULT true,
  client_id           text              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at          timestamptz       NOT NULL DEFAULT now(),
  updated_at          timestamptz       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_requests_client_id_idx ON service_requests (client_id);
CREATE INDEX IF NOT EXISTS service_requests_category_idx ON service_requests (category);
CREATE INDEX IF NOT EXISTS service_requests_open_idx ON service_requests (open) WHERE open = true;
CREATE INDEX IF NOT EXISTS service_requests_created_at_idx ON service_requests (created_at DESC);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_requests_select" ON service_requests;
CREATE POLICY "service_requests_select" ON service_requests FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "service_requests_insert" ON service_requests;
CREATE POLICY "service_requests_insert" ON service_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "service_requests_update" ON service_requests;
CREATE POLICY "service_requests_update" ON service_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_requests_delete" ON service_requests;
CREATE POLICY "service_requests_delete" ON service_requests FOR DELETE TO anon, authenticated USING (true);

-- ── Request Responses ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS request_responses (
  id              text                    PRIMARY KEY,
  request_id      text                    NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  provider_id     text                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message         text                    NOT NULL,
  proposed_price  double precision,
  status          request_response_status NOT NULL DEFAULT 'PENDING',
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now(),

  UNIQUE (request_id, provider_id)
);

CREATE INDEX IF NOT EXISTS request_responses_request_id_idx ON request_responses (request_id);
CREATE INDEX IF NOT EXISTS request_responses_provider_id_idx ON request_responses (provider_id);
CREATE INDEX IF NOT EXISTS request_responses_status_idx ON request_responses (status);

ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_responses_select" ON request_responses;
CREATE POLICY "request_responses_select" ON request_responses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "request_responses_insert" ON request_responses;
CREATE POLICY "request_responses_insert" ON request_responses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "request_responses_update" ON request_responses;
CREATE POLICY "request_responses_update" ON request_responses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "request_responses_delete" ON request_responses;
CREATE POLICY "request_responses_delete" ON request_responses FOR DELETE TO anon, authenticated USING (true);
