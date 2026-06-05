/*
# Create all application enums

Creates all PostgreSQL enum types used across the schema.

## Enums created:
- `role` — User role: CLIENT, PROVIDER, ADMIN
- `kyc_status` — KYC verification state: NOT_STARTED, APPROVED
- `kyc_document_type` — Document types for KYC: CIN, RESIDENCE_CERTIFICATE
- `booking_status` — Booking lifecycle: PENDING, CONFIRMED, COMPLETED, CANCELLED
- `request_response_status` — Proposal status: PENDING, ACCEPTED, REJECTED, WITHDRAWN, COMPLETED
- `message_kind` — Message type: TEXT, PRICE_OFFER
- `price_offer_status` — Price offer state: PENDING, ACCEPTED, SUPERSEDED
- `transaction_status` — Payment state: PENDING, SUCCESS, FAILED
- `payment_method` — Mobile money providers: ORANGE_MONEY, MVOLA, AIRTEL_MONEY

## Notes
All statements use DO blocks with IF NOT EXISTS checks to be fully idempotent.
*/

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('NOT_STARTED', 'APPROVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_document_type AS ENUM ('CIN', 'RESIDENCE_CERTIFICATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_response_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_kind AS ENUM ('TEXT', 'PRICE_OFFER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE price_offer_status AS ENUM ('PENDING', 'ACCEPTED', 'SUPERSEDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('ORANGE_MONEY', 'MVOLA', 'AIRTEL_MONEY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
