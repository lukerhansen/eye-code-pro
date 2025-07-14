-- Make team name nullable to support onboarding flow
ALTER TABLE "teams" ALTER COLUMN "name" DROP NOT NULL;