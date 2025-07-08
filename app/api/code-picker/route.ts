import { NextRequest, NextResponse } from 'next/server';
import { logBillingEntry } from '@/lib/db/queries';
import {
  DOCTORS,
  DIAGNOSIS_ELIGIBILITY,
  coversFullExam,
  getReimbursement,
  getCodePair,
  higherPayingCode,
  higherPayingCodeWithDebug,
} from '@/lib/insurance-data';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    insurancePlan,
    freeExamBilledLastYear,
    patientType,
    level,
    diagnosis,
    doctor,
    isEmergencyVisit = false,
  } = body;

  try {
    if (!['new', 'established'].includes(patientType)) {
      throw new Error('Invalid patient type');
    }
    if (![2, 3, 4, 5].includes(level)) {
      throw new Error('Invalid level');
    }

    const doctorType = DOCTORS[doctor] ?? 'Unknown';
    const isOD = doctorType === 'OD';
    const isMedicaid = insurancePlan === 'Medicaid';

    let rationale = '';
    let recommendedCode: string | null = null;
    let debugInfo: any = null;

    if (isOD && isMedicaid) {
      // OD on Medicaid always uses eye code (92)
      const actualLevel = level === 5 ? 4 : level;
      const [eyeCode] = getCodePair(patientType, actualLevel);
      recommendedCode = eyeCode;
      const amount = getReimbursement('Medicaid', recommendedCode!);
      rationale = `OD on Medicaid - always use eye code (92) ($${amount.toFixed(2)})`;
      if (level === 5) {
        rationale += ` - level ${level} bumped down to level ${actualLevel}`;
      }
      if (!DIAGNOSIS_ELIGIBILITY[diagnosis]) {
        rationale += ' - vision diagnosis (code: H52.13)';
      }
    } else {
      const [eyeCode, emCode] = getCodePair(patientType, level);
      const result = higherPayingCodeWithDebug(eyeCode, emCode, insurancePlan);
      recommendedCode = result.winningCode;
      const amount = getReimbursement(insurancePlan, recommendedCode!);
      rationale = `Standard billing - highest-paying code for ${insurancePlan} ($${amount.toFixed(2)})`;
      const hasFreeExam = coversFullExam(insurancePlan) && !freeExamBilledLastYear && !isEmergencyVisit;
      if (hasFreeExam) {
        rationale += ' - Preventative exam (Diagnostic code: Z01.00)';
      }
      
      // Add debugging information
      debugInfo = result.comparison ? {
        codeComparison: result.comparison
      } : null;
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

    return NextResponse.json({ rationale, recommendedCode, billingEntryId, debugInfo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 