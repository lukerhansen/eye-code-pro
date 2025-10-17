// Demo data for landing page code-picker
// This data is completely fake and for demonstration purposes only

export interface DemoDoctor {
  id: number;
  name: string;
  degree: 'OD' | 'MD';
}

export interface DemoInsurance {
  id: number;
  name: string;
  coversFreeExam: boolean;
}

// Fake doctors for demo
export const DEMO_DOCTORS: DemoDoctor[] = [
  { id: 1, name: 'Dr. Sarah Chen', degree: 'OD' },
  { id: 2, name: 'Dr. Michael Rodriguez', degree: 'MD' },
  { id: 3, name: 'Dr. Emily Thompson', degree: 'OD' },
  { id: 4, name: 'Dr. James Park', degree: 'MD' },
];

// Fake insurance plans for demo
export const DEMO_INSURANCES: DemoInsurance[] = [
  { id: 1, name: 'Premier Health Plan', coversFreeExam: true },
  { id: 2, name: 'Select Care Network', coversFreeExam: false },
  { id: 3, name: 'Advantage Vision Group', coversFreeExam: true },
  { id: 4, name: 'Elite Eye Care Plan', coversFreeExam: false },
  { id: 5, name: 'Summit Medical Alliance', coversFreeExam: false },
  { id: 6, name: 'First Choice Coverage', coversFreeExam: true },
];

// Demo fee schedules (realistic but fake pricing)
export const DEMO_FEE_SCHEDULES: Record<string, Record<string, number>> = {
  'Premier Health Plan': {
    '92002': 77.66,
    '92004': 137.33,
    '92012': 81.66,
    '92014': 115.94,
    '99202': 67.20,
    '99203': 105.16,
    '99204': 158.02,
    '99205': 228.17,
    '99212': 52.82,
    '99213': 85.80,
    '99214': 120.94,
    '99215': 185.64,
  },
  'Select Care Network': {
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
    '99215': 134.10,
  },
  'Advantage Vision Group': {
    '92002': 95.50,
    '92004': 165.00,
    '92012': 98.00,
    '92014': 138.50,
    '99202': 85.00,
    '99203': 132.00,
    '99204': 195.00,
    '99205': 245.00,
    '99212': 58.00,
    '99213': 92.00,
    '99214': 135.00,
    '99215': 189.00,
  },
  'Elite Eye Care Plan': {
    '92002': 88.00,
    '92004': 155.00,
    '92012': 91.00,
    '92014': 128.00,
    '99202': 78.00,
    '99203': 122.00,
    '99204': 180.00,
    '99205': 230.00,
    '99212': 54.00,
    '99213': 86.00,
    '99214': 125.00,
    '99215': 175.00,
  },
  'Summit Medical Alliance': {
    '92002': 92.00,
    '92004': 160.00,
    '92012': 95.00,
    '92014': 133.00,
    '99202': 82.00,
    '99203': 127.00,
    '99204': 188.00,
    '99205': 238.00,
    '99212': 56.00,
    '99213': 89.00,
    '99214': 130.00,
    '99215': 182.00,
  },
  'First Choice Coverage': {
    '92002': 90.00,
    '92004': 158.00,
    '92012': 93.00,
    '92014': 130.00,
    '99202': 80.00,
    '99203': 125.00,
    '99204': 185.00,
    '99205': 235.00,
    '99212': 55.00,
    '99213': 87.00,
    '99214': 128.00,
    '99215': 180.00,
  },
};

// Code pairs for different patient types and levels
export const DEMO_CODES: Record<string, Record<number, [string | null, string | null]>> = {
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

// Diagnosis options
export const DEMO_DIAGNOSES = [
  'Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)',
  'Medical diagnosis',
];

// Diagnosis eligibility for medical billing
export const DEMO_DIAGNOSIS_ELIGIBILITY: Record<string, boolean> = {
  'Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)': false,
  'Medical diagnosis': true,
};

// Utility functions for demo data
export function getDemoReimbursement(insuranceName: string, code: string | null): number {
  if (!code) return 0;

  // Check if the insurance plan exists in DEMO_FEE_SCHEDULES
  if (DEMO_FEE_SCHEDULES[insuranceName]?.[code]) {
    return DEMO_FEE_SCHEDULES[insuranceName][code];
  }

  // If insurance plan not found, use Premier Health Plan as default
  return DEMO_FEE_SCHEDULES['Premier Health Plan']?.[code] ?? 0;
}

export function getDemoCodePair(patientType: 'new' | 'established', level: number): [string | null, string | null] {
  const pair = DEMO_CODES[patientType]?.[level];
  if (!pair) throw new Error('Invalid patient type or level');
  return pair;
}

export function calculateDemoCode(params: {
  doctor: DemoDoctor;
  insurance: DemoInsurance;
  patientType: 'new' | 'established';
  level: number;
  freeExamBilled: boolean;
  isEmergencyVisit: boolean;
  diagnosis: string;
}): {
  recommendedCode: string | null;
  diagnosisCode: string | null;
  debugInfo: {
    codeComparison: {
      code1: string | null;
      code1Price: number;
      code2: string | null;
      code2Price: number;
      insurancePlan: string;
    };
  };
} {
  const { doctor, insurance, patientType, level, freeExamBilled, isEmergencyVisit, diagnosis } = params;

  const isOD = doctor.degree === 'OD';
  const isSelectCare = insurance.name === 'Select Care Network';

  let recommendedCode: string | null = null;
  let diagnosisCode: string | null = null;

  // Handle OD + Select Care Network special case
  if (isOD && isSelectCare) {
    const isRoutineEyeExam = !DEMO_DIAGNOSIS_ELIGIBILITY[diagnosis];

    if (isRoutineEyeExam) {
      // Routine eye exam - use eye code
      const actualLevel = level === 5 ? 4 : level;
      const [eyeCode, emCode] = getDemoCodePair(patientType, actualLevel);
      recommendedCode = eyeCode || emCode;
      diagnosisCode = "Consider diagnosis code H52.13";
    } else {
      // Medical visit - compare both codes
      const [eyeCode, emCode] = getDemoCodePair(patientType, level);
      const eyeCodeAmount = eyeCode ? getDemoReimbursement(insurance.name, eyeCode) : 0;
      const emCodeAmount = emCode ? getDemoReimbursement(insurance.name, emCode) : 0;

      if (!eyeCode && emCode) {
        recommendedCode = emCode;
      } else if (eyeCode && !emCode) {
        recommendedCode = eyeCode;
      } else if (eyeCodeAmount >= emCodeAmount) {
        recommendedCode = eyeCode;
      } else {
        recommendedCode = emCode;
      }
    }
  } else {
    // Standard billing logic - compare eye code vs E&M code
    const [eyeCode, emCode] = getDemoCodePair(patientType, level);

    const eyeCodeAmount = eyeCode ? getDemoReimbursement(insurance.name, eyeCode) : 0;
    const emCodeAmount = emCode ? getDemoReimbursement(insurance.name, emCode) : 0;

    if (!eyeCode && emCode) {
      recommendedCode = emCode;
    } else if (eyeCode && !emCode) {
      recommendedCode = eyeCode;
    } else if (eyeCodeAmount >= emCodeAmount) {
      recommendedCode = eyeCode;
    } else {
      recommendedCode = emCode;
    }

    // Handle free exam coverage
    const hasFreeExam = insurance.coversFreeExam && !freeExamBilled && !isEmergencyVisit;
    if (hasFreeExam) {
      diagnosisCode = "Consider diagnosis code: Z01.01 or Z01.00";
    }
  }

  // Get code pair for debug info
  const [eyeCode, emCode] = getDemoCodePair(patientType, level);
  const eyeCodeAmount = eyeCode ? getDemoReimbursement(insurance.name, eyeCode) : 0;
  const emCodeAmount = emCode ? getDemoReimbursement(insurance.name, emCode) : 0;

  return {
    recommendedCode,
    diagnosisCode,
    debugInfo: {
      codeComparison: {
        code1: eyeCode,
        code1Price: eyeCodeAmount,
        code2: emCode,
        code2Price: emCodeAmount,
        insurancePlan: insurance.name,
      },
    },
  };
}
