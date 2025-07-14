-- Add coversFreeExam column to doctor_insurances table
-- This allows doctors to override the insurance plan's default free exam coverage setting
-- NULL means use the insurance plan's default value
ALTER TABLE doctor_insurances 
ADD COLUMN covers_free_exam BOOLEAN DEFAULT NULL;

-- Add comment to explain the three-state logic
COMMENT ON COLUMN doctor_insurances.covers_free_exam IS 
'Override for insurance plan free exam coverage. NULL = use insurance default, TRUE = covers free exam, FALSE = does not cover free exam';