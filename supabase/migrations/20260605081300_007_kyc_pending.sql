-- Add PENDING status for admin KYC review workflow
ALTER TYPE kyc_status ADD VALUE IF NOT EXISTS 'PENDING' AFTER 'NOT_STARTED';
