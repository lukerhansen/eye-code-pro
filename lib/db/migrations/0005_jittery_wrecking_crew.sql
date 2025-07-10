-- Custom SQL migration file, put your code below! --
-- Convert region-based data to state-based data

-- First drop the NOT NULL constraint
ALTER TABLE "default_fee_schedules" ALTER COLUMN "region" DROP NOT NULL;

-- Rename the column
ALTER TABLE "default_fee_schedules" RENAME COLUMN "region" TO "state";

-- Clear existing regional data and convert to global defaults
-- This will be re-seeded with proper state data
UPDATE "default_fee_schedules" SET "state" = NULL;

-- Change column type to varchar(2) for state codes
ALTER TABLE "default_fee_schedules" ALTER COLUMN "state" TYPE varchar(2);