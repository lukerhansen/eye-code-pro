-- Fix the default value for doctor_limit column to be 0 instead of 1
ALTER TABLE "teams" ALTER COLUMN "doctor_limit" SET DEFAULT 0;

-- Update any existing teams that have doctor_limit = 1 but no active subscription
-- This ensures teams without subscriptions cannot add doctors
UPDATE "teams" 
SET "doctor_limit" = 0 
WHERE "doctor_limit" = 1 
  AND ("subscription_status" IS NULL OR "subscription_status" NOT IN ('active', 'trialing'));