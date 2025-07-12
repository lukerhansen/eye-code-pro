-- Add doctor_limit column to teams table for doctor-based billing
ALTER TABLE "teams" ADD COLUMN "doctor_limit" integer NOT NULL DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN "teams"."doctor_limit" IS 'Maximum number of doctors allowed for this team based on their subscription';