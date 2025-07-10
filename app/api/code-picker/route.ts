import { NextRequest, NextResponse } from 'next/server';
import { logBillingEntry, getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { 
  doctors, 
  doctorInsurances, 
  insurancePlans,
  defaultFeeSchedules,
  customFeeSchedules 
} from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import {
  DIAGNOSIS_ELIGIBILITY,
  getCodePair,
} from '@/lib/insurance-data';

const DIAGNOSIS_CODE_MAP: Record<string, string> = {
  "Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)": "H52.13",  
  "Medical diagnosis": "Z01.00",
};

// Helper function to get reimbursement from database
async function getDynamicReimbursement(
  doctorId: number, 
  insurancePlanName: string, 
  code: string,
  teamState?: string | null
): Promise<number> {
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

  return defaultFee ? defaultFee.amount / 100 : 0;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    doctorId,
    insurancePlan,
    freeExamBilledLastYear,
    patientType,
    level,
    diagnosis,
    doctor,
    isEmergencyVisit = false,
  } = body;

  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    if (!['new', 'established'].includes(patientType)) {
      throw new Error('Invalid patient type');
    }
    if (![2, 3, 4, 5].includes(level)) {
      throw new Error('Invalid level');
    }

    // Get doctor information
    const [doctorRecord] = await db
      .select()
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.teamId, team.id)))
      .limit(1);

    if (!doctorRecord) {
      throw new Error('Doctor not found');
    }

    // Get insurance plan info
    const [insurancePlanRecord] = await db
      .select()
      .from(insurancePlans)
      .where(eq(insurancePlans.name, insurancePlan))
      .limit(1);

    if (!insurancePlanRecord) {
      throw new Error('Insurance plan not found');
    }

    const isOD = doctorRecord.degree === 'OD';
    const isMedicaid = insurancePlan === 'Medicaid';

    let rationale = '';
    let recommendedCode: string | null = null;
    let debugInfo: any = null;
    let diagnosisCode: string | null = null;

    if (isOD && isMedicaid) {
      // OD on Medicaid always uses eye code (92)
      const actualLevel = level === 5 ? 4 : level;
      const [eyeCode] = getCodePair(patientType, actualLevel);
      recommendedCode = eyeCode;
      const amount = await getDynamicReimbursement(doctorId, 'Medicaid', recommendedCode!, team.state);
      rationale = `OD on Medicaid - always use eye code (92) ($${amount.toFixed(2)})`;
      if (level === 5) {
        rationale += ` - level ${level} bumped down to level ${actualLevel}`;
      }
      if (!DIAGNOSIS_ELIGIBILITY[diagnosis]) {
        rationale += ' - vision diagnosis (code: H52.13)';
        diagnosisCode = "H52.13";
      }
    } else {
      const [eyeCode, emCode] = getCodePair(patientType, level);
      
      // Get reimbursements for both codes
      const eyeCodeAmount = eyeCode ? await getDynamicReimbursement(doctorId, insurancePlan, eyeCode, team.state) : 0;
      const emCodeAmount = emCode ? await getDynamicReimbursement(doctorId, insurancePlan, emCode, team.state) : 0;
      
      // Determine which code pays more
      if (eyeCodeAmount >= emCodeAmount) {
        recommendedCode = eyeCode;
      } else {
        recommendedCode = emCode;
      }
      
      const amount = Math.max(eyeCodeAmount, emCodeAmount);
      rationale = `Standard billing - highest-paying code for ${insurancePlan} ($${amount.toFixed(2)})`;
      
      const hasFreeExam = insurancePlanRecord.coversFreeExam && !freeExamBilledLastYear && !isEmergencyVisit;
      if (hasFreeExam) {
        rationale += ' - Preventative exam (Diagnostic code: Z01.00)';
        diagnosisCode = "Z01.00"
        //TDOO assumption: maybe not all insurances that have free exams, bill this diagnosis code.
      }
      
      // Add debugging information
      debugInfo = {
        codeComparison: {
          code1: eyeCode,
          code1Price: eyeCodeAmount,
          code2: emCode,
          code2Price: emCodeAmount,
          insurancePlan: insurancePlan
        }
      };
    }

    // Save the billing entry for the current user
    let billingEntryId: number | undefined;
    try {
      billingEntryId = await logBillingEntry({
        insurancePlan,
        doctor,
        patientType,
        level,
        recommendedCode: recommendedCode ?? '',
        diagnosis,
        isEmergencyVisit,
        freeExamBilledLastYear,
      });
    } catch (error) {
      // Non-fatal – continue even if the log fails
      console.error('Failed to log billing entry', error);
    }

    return NextResponse.json({ rationale, recommendedCode, billingEntryId, debugInfo, diagnosisCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 