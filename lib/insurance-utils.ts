import { db } from '@/lib/db/drizzle';
import { 
  insurancePlans,
  defaultFeeSchedules,
  customFeeSchedules,
  doctorInsurances
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getHardcodedFallbackRate } from '@/lib/insurance-data';

// Helper function to get reimbursement from database with fallback logic
export async function getDynamicReimbursement(
  doctorId: number, 
  insurancePlanName: string, 
  code: string,
  teamState?: string | null,
  otherSelectedAsInsurance?: boolean
): Promise<number> {
  // If "Other" is selected as insurance, skip directly to hardcoded fallback
  if (otherSelectedAsInsurance) {
    return getHardcodedFallbackRate(insurancePlanName, code);
  }
  // First, get the insurance plan
  const [insurancePlan] = await db
    .select()
    .from(insurancePlans)
    .where(eq(insurancePlans.name, insurancePlanName))
    .limit(1);

  if (!insurancePlan) {
    return 0;
  }

  // Check if doctor has custom fee schedule for this insurance
  const doctorInsurance = await db
    .select()
    .from(doctorInsurances)
    .where(and(
      eq(doctorInsurances.doctorId, doctorId),
      eq(doctorInsurances.insurancePlanId, insurancePlan.id)
    ))
    .limit(1);

  if (doctorInsurance[0]?.useCustomFeeSchedule) {
    // Get custom fee
    const [customFee] = await db
      .select()
      .from(customFeeSchedules)
      .where(and(
        eq(customFeeSchedules.doctorInsuranceId, doctorInsurance[0].id),
        eq(customFeeSchedules.code, code)
      ))
      .limit(1);

    if (customFee) {
      return customFee.amount / 100; // Convert cents to dollars
    }
  }

  // Get state-specific fee schedule first, then fallback to global
  let defaultFee;
  
  if (teamState) {
    // Try to get state-specific fee schedule
    [defaultFee] = await db
      .select()
      .from(defaultFeeSchedules)
      .where(and(
        eq(defaultFeeSchedules.insurancePlanId, insurancePlan.id),
        eq(defaultFeeSchedules.code, code),
        eq(defaultFeeSchedules.state, teamState)
      ))
      .limit(1);
  }
  
  // If no state-specific fee found, try global default (state = null)
  if (!defaultFee) {
    [defaultFee] = await db
      .select()
      .from(defaultFeeSchedules)
      .where(and(
        eq(defaultFeeSchedules.insurancePlanId, insurancePlan.id),
        eq(defaultFeeSchedules.code, code),
        isNull(defaultFeeSchedules.state)
      ))
      .limit(1);
  }

  if (defaultFee) {
    return defaultFee.amount / 100;
  }

  // Final fallback: use hardcoded rates based on insurance type
  return getHardcodedFallbackRate(insurancePlanName, code);
}

// Helper function to get reimbursement by insurance plan ID (for fee configuration UI)
export async function getDynamicReimbursementById(
  doctorId: number, 
  insurancePlanId: number, 
  code: string,
  teamState?: string | null,
  otherSelectedAsInsurance?: boolean
): Promise<number> {
  // Get the insurance plan name first
  const [insurancePlan] = await db
    .select()
    .from(insurancePlans)
    .where(eq(insurancePlans.id, insurancePlanId))
    .limit(1);

  if (!insurancePlan) {
    return 0;
  }

  // If "Other" is selected as insurance, skip directly to hardcoded fallback
  if (otherSelectedAsInsurance) {
    return getHardcodedFallbackRate(insurancePlan.name, code);
  }

  // Check if doctor has custom fee schedule for this insurance
  const doctorInsurance = await db
    .select()
    .from(doctorInsurances)
    .where(and(
      eq(doctorInsurances.doctorId, doctorId),
      eq(doctorInsurances.insurancePlanId, insurancePlanId)
    ))
    .limit(1);

  if (doctorInsurance[0]?.useCustomFeeSchedule) {
    // Get custom fee
    const [customFee] = await db
      .select()
      .from(customFeeSchedules)
      .where(and(
        eq(customFeeSchedules.doctorInsuranceId, doctorInsurance[0].id),
        eq(customFeeSchedules.code, code)
      ))
      .limit(1);

    if (customFee) {
      return customFee.amount / 100; // Convert cents to dollars
    }
  }

  // Get state-specific fee schedule first, then fallback to global
  let defaultFee;
  
  if (teamState) {
    // Try to get state-specific fee schedule
    [defaultFee] = await db
      .select()
      .from(defaultFeeSchedules)
      .where(and(
        eq(defaultFeeSchedules.insurancePlanId, insurancePlanId),
        eq(defaultFeeSchedules.code, code),
        eq(defaultFeeSchedules.state, teamState)
      ))
      .limit(1);
  }
  
  // If no state-specific fee found, try global default (state = null)
  if (!defaultFee) {
    [defaultFee] = await db
      .select()
      .from(defaultFeeSchedules)
      .where(and(
        eq(defaultFeeSchedules.insurancePlanId, insurancePlanId),
        eq(defaultFeeSchedules.code, code),
        isNull(defaultFeeSchedules.state)
      ))
      .limit(1);
  }

  if (defaultFee) {
    return defaultFee.amount / 100;
  }

  // Final fallback: use hardcoded rates based on insurance type
  return getHardcodedFallbackRate(insurancePlan.name, code);
}