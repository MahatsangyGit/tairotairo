/*
# Remove legacy RESIDENCE_CERTIFICATE from KYC document type enum

Supports both Prisma-managed DBs (PascalCase) and Supabase SQL migrations (snake_case).
*/

-- Prisma schema (db push): "ProviderKycDocument" + KycDocumentType
DO $$ BEGIN
  IF to_regclass('"ProviderKycDocument"') IS NOT NULL THEN
    DELETE FROM "ProviderKycDocument"
    WHERE type::text = 'RESIDENCE_CERTIFICATE';

    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'KycDocumentType'
        AND e.enumlabel = 'RESIDENCE_CERTIFICATE'
    ) THEN
      ALTER TYPE "KycDocumentType" RENAME TO "KycDocumentType_old";

      CREATE TYPE "KycDocumentType" AS ENUM ('CIN');

      ALTER TABLE "ProviderKycDocument"
        ALTER COLUMN type TYPE "KycDocumentType"
        USING (type::text::"KycDocumentType");

      DROP TYPE "KycDocumentType_old";
    END IF;
  END IF;
END $$;

-- Supabase SQL migrations: provider_kyc_documents + kyc_document_type
DO $$ BEGIN
  IF to_regclass('provider_kyc_documents') IS NOT NULL THEN
    DELETE FROM provider_kyc_documents
    WHERE type::text = 'RESIDENCE_CERTIFICATE';

    IF EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'kyc_document_type'
        AND e.enumlabel = 'RESIDENCE_CERTIFICATE'
    ) THEN
      ALTER TYPE kyc_document_type RENAME TO kyc_document_type_old;

      CREATE TYPE kyc_document_type AS ENUM ('CIN');

      ALTER TABLE provider_kyc_documents
        ALTER COLUMN type TYPE kyc_document_type
        USING (type::text::kyc_document_type);

      DROP TYPE kyc_document_type_old;
    END IF;
  END IF;
END $$;
