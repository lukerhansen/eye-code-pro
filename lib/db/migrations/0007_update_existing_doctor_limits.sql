-- Update existing teams to have 0 doctor limit by default
-- Only teams with active subscriptions should have doctor limits > 0
UPDATE "teams" 
SET "doctor_limit" = 0 
WHERE "subscription_status" IS NULL 
   OR "subscription_status" NOT IN ('active', 'trialing');

-- Add comment
COMMENT ON COLUMN "teams"."doctor_limit" IS 'Maximum number of doctors allowed for this team based on their subscription. Default is 0 (no free doctors allowed).';