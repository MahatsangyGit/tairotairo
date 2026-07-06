/*
# Optional: migrate monetary Float columns to DECIMAL(12,2)
# Apply only after validating serialization in API routes.
*/
-- ALTER TABLE "Service" ALTER COLUMN price TYPE DECIMAL(12,2) USING price::numeric;
-- ALTER TABLE "ServiceRequest" ALTER COLUMN budget TYPE DECIMAL(12,2) USING budget::numeric;
-- ALTER TABLE "Booking" ALTER COLUMN "displayPrice" TYPE DECIMAL(12,2) USING "displayPrice"::numeric;
-- ALTER TABLE "Transaction" ALTER COLUMN amount TYPE DECIMAL(12,2) USING amount::numeric;
