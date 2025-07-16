import { NextRequest, NextResponse } from 'next/server';
import { logBillingEntry, getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { 
  doctors, 
  insurancePlans,
  doctorInsurances
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  DIAGNOSIS_ELIGIBILITY,
  getCodePair,
} from '@/lib/insurance-data';
import { getDynamicReimbursement } from '@/lib/insurance-utils';

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
    otherSelectedAsInsurance = false,
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

    // Get insurance plan info (skip if "Other" is selected)
    let insurancePlanRecord = null;
    let doctorInsuranceRecord = null;
    if (!otherSelectedAsInsurance) {
      const [plan] = await db
        .select()
        .from(insurancePlans)
        .where(eq(insurancePlans.name, insurancePlan))
        .limit(1);
      
      if (!plan) {
        throw new Error('Insurance plan not found');
      }
      insurancePlanRecord = plan;
      
      // Get doctor-insurance relationship to check for free exam override
      const [doctorInsurance] = await db
        .select()
        .from(doctorInsurances)
        .where(and(
          eq(doctorInsurances.doctorId, doctorId),
          eq(doctorInsurances.insurancePlanId, plan.id)
        ))
        .limit(1);
      
      doctorInsuranceRecord = doctorInsurance;
    }

    const isOD = doctorRecord.degree === 'OD';
    const isMedicaid = insurancePlan === 'Medicaid';

    let rationale = '';
    let recommendedCode: string | null = null;
    let debugInfo: any = null;
    let diagnosisCode: string | null = null;

    if (isOD && isMedicaid) {
      // OD on Medicaid prefers eye code (92) but falls back to E&M if no eye code exists
      const actualLevel = level === 5 ? 4 : level;
      const [eyeCode, emCode] = getCodePair(patientType, actualLevel);
      
      // Use eye code if available, otherwise use E&M code
      recommendedCode = eyeCode || emCode;
      
      const amount = await getDynamicReimbursement(doctorId, 'Medicaid', recommendedCode!, team.state, otherSelectedAsInsurance);
      
      if (eyeCode) {
        rationale = `OD on Medicaid - always use eye code (92) ($${amount.toFixed(2)})`;
      } else {
        rationale = `OD on Medicaid - using E&M code as no eye code available ($${amount.toFixed(2)})`;
      }
      
      if (level === 5) {
        rationale += ` - level ${level} bumped down to level ${actualLevel}`;
      }
      if (!DIAGNOSIS_ELIGIBILITY[diagnosis]) {
        rationale += ' - vision diagnosis (code: H52.13)';
        diagnosisCode = "Consider diagnosis code H52.13";
      }
    } else {
      const [eyeCode, emCode] = getCodePair(patientType, level);
      
      // Get reimbursements for both codes
      const eyeCodeAmount = eyeCode ? await getDynamicReimbursement(doctorId, insurancePlan, eyeCode, team.state, otherSelectedAsInsurance) : 0;
      const emCodeAmount = emCode ? await getDynamicReimbursement(doctorId, insurancePlan, emCode, team.state, otherSelectedAsInsurance) : 0;
      
      // Determine which code to use - if one is null, use the other one
      if (!eyeCode && emCode) {
        recommendedCode = emCode;
      } else if (eyeCode && !emCode) {
        recommendedCode = eyeCode;
      } else if (eyeCodeAmount >= emCodeAmount) {
        recommendedCode = eyeCode;
      } else {
        recommendedCode = emCode;
      }
      
      const amount = Math.max(eyeCodeAmount, emCodeAmount);
      rationale = `Standard billing - highest-paying code for ${insurancePlan} ($${amount.toFixed(2)})`;
      
      // Check for free exam coverage - first check doctor-specific override, then fall back to insurance default
      let coversFreeExam = false;
      if (doctorInsuranceRecord?.coversFreeExam !== null && doctorInsuranceRecord?.coversFreeExam !== undefined) {
        // Use doctor-specific override
        coversFreeExam = doctorInsuranceRecord.coversFreeExam;
      } else if (insurancePlanRecord) {
        // Use insurance plan default
        coversFreeExam = insurancePlanRecord.coversFreeExam;
      }
      
      const hasFreeExam = coversFreeExam && !freeExamBilledLastYear && !isEmergencyVisit;
      if (hasFreeExam) {
        rationale += ' - Preventative exam (Diagnostic code: Z01.00)';
        diagnosisCode = "Consider diagnosis code: Z01.01 or Z01.00";
        //TODO assumption: maybe not all insurances that have free exams, bill this diagnosis code.
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