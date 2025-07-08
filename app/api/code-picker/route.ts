import { NextRequest, NextResponse } from 'next/server';
import { logBillingEntry } from '@/lib/db/queries';

// Placeholder data duplicated from insurance_data.py (simplified for demo)
const CODE_REIMBURSEMENT: Record<string, Record<string, number>> = {
  Medicare: {
    '92002': 77.66,
    '92004': 137.33,
    '92012': 81.66,
    '92014': 115.94,
    '99202': 67.2,
    '99203': 105.16,
    '99204': 158.02,
    '99205': 228.17,
    '99212': 52.82,
    '99213': 85.8,
    '99214': 120.94,
    '99215': 185.64,
  },
  Medicaid: {
    '92002': 62.19,
    '92004': 109.99,
    '92012': 65.41,
    '92014': 92.86,
    '99202': 53.82,
    '99203': 84.22,
    '99204': 126.56,
    '99205': 167.27,
    '99212': 41.68,
    '99213': 67.71,
    '99214': 95.44,
    '99215': 134.1,
  },
};

const INSURANCE_PLANS: Record<string, boolean> = {
  Medicare: false,
  Medicaid: false,
  'United Health Care': false,
  'Aetna Medicare': false,
  UMWA: false,
  DMBA: false,
  Aetna: false,
  BCBS: false,
  PEHP: true,
  Other: false,
  SelectHealth: true,
};

const DOCTORS: Record<string, string> = {
  'Dr. Jensen': 'OD',
  'Dr. Hansen': 'MD',
  'Dr. Hillam': 'DO',
};

const DIAGNOSIS_ELIGIBILITY: Record<string, boolean> = {
  'Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)': false,
  'Medical diagnosis': true,
};

const CODES: Record<string, Record<number, [string | null, string | null]>> = {
  new: {
    2: ['92002', '99202'],
    3: ['92004', '99203'],
    4: ['92004', '99204'],
    5: [null, '99205'],
  },
  established: {
    2: [null, '99212'],
    3: ['92012', '99213'],
    4: ['92014', '99214'],
    5: [null, '99215'],
  },
};

function coversFullExam(insurancePlan: string) {
  return INSURANCE_PLANS[insurancePlan] ?? false;
}

function getReimbursement(insurancePlan: string, code: string | null | undefined) {
  if (!code) return 0;
  return CODE_REIMBURSEMENT[insurancePlan]?.[code] ?? 0;
}

function getCodePair(patientType: 'new' | 'established', level: number) {
  const pair = CODES[patientType]?.[level];
  if (!pair) throw new Error('Invalid patient type or level');
  return pair;
}

function higherPayingCode(code1: string | null, code2: string | null, insurancePlan: string) {
  if (!code1 && !code2) return null;
  if (!code1) return code2;
  if (!code2) return code1;
  return getReimbursement(insurancePlan, code1) >= getReimbursement(insurancePlan, code2) ? code1 : code2;
}

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
      recommendedCode = higherPayingCode(eyeCode, emCode, insurancePlan);
      const amount = getReimbursement(insurancePlan, recommendedCode!);
      rationale = `Standard billing - highest-paying code for ${insurancePlan} ($${amount.toFixed(2)})`;
      const hasFreeExam = coversFullExam(insurancePlan) && !freeExamBilledLastYear && !isEmergencyVisit;
      if (hasFreeExam) {
        rationale += ' - Preventative exam (Diagnostic code: Z01.00)';
      }
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

    return NextResponse.json({ rationale, recommendedCode, billingEntryId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 