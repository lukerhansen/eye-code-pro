// Insurance reimbursement rates by plan and code
export const CODE_REIMBURSEMENT: Record<string, Record<string, number>> = {
  //defaults to medicare if not specified
  Medicare: {
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
    '99215': 134.10,
  },
  'Humana Choice': {
    '92002': 75.21,
    '92004': 137.27,
    '92012': 68.81,
    '92014': 101.88,
    '99202': 68.99,
    '99203': 102.58,
    '99204': 145.40,
    '99205': 266.01,
    '99212': 40.72,
    '99213': 55.77,
    '99214': 87.55,
    '99215': 190.01,
  },
  'default_private_insurance': {
    '92002': 75.21,
    '92004': 137.27,
    '92012': 68.81,
    '92014': 101.88,
    '99202': 68.99,
    '99203': 102.58,
    '99204': 145.40,
    '99205': 266.01,
    '99212': 40.72,
    '99213': 55.77,
    '99214': 87.55,
    '99215': 190.01,
  },
};

// Insurance plans and whether they cover full exams
export const INSURANCE_PLANS: Record<string, boolean> = {
  Medicare: false,
  Medicaid: false,
  VA: false,
  'Humana Choice': false,
  'Humana Medicare': false,
  'United Health Care': false,
  'Aetna Medicare': false,
  UMWA: false,
  DMBA: false,
  Aetna: false,
  BCBS: false,
  PEHP: true,
  SelectHealth: true,
};

// Available doctors and their types
export const DOCTORS: Record<string, string> = {
  'Dr. Jensen': 'OD',
  'Dr. Hansen': 'MD',
  'Dr. Hillam': 'DO',
};

// Diagnosis eligibility for medical billing
export const DIAGNOSIS_ELIGIBILITY: Record<string, boolean> = {
  'Routine eye exam (myopia, hyperopia, astigmatism, presbyopia)': false,
  'Medical diagnosis': true,
};

// Code pairs for different patient types and levels
export const CODES: Record<string, Record<number, [string | null, string | null]>> = {
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

// Utility functions for insurance data
export function coversFullExam(insurancePlan: string): boolean {
  return INSURANCE_PLANS[insurancePlan] ?? false;
}

export function getReimbursement(insurancePlan: string, code: string | null | undefined): number {
  if (!code) return 0;

  // Check if the insurance plan exists in CODE_REIMBURSEMENT
  if (CODE_REIMBURSEMENT[insurancePlan]?.[code]) {
    return CODE_REIMBURSEMENT[insurancePlan][code];
  }

  // If insurance plan not found, use Medicare as default
  return CODE_REIMBURSEMENT.Medicare?.[code] ?? 0;
}

export function getCodePair(patientType: 'new' | 'established', level: number): [string | null, string | null] {
  const pair = CODES[patientType]?.[level];
  if (!pair) throw new Error('Invalid patient type or level');
  return pair;
}

export function higherPayingCode(code1: string | null, code2: string | null, insurancePlan: string): string | null {
  if (!code1 && !code2) return null;
  if (!code1) return code2;
  if (!code2) return code1;
  return getReimbursement(insurancePlan, code1) >= getReimbursement(insurancePlan, code2) ? code1 : code2;
}

// New function for testing - returns detailed comparison information
export function higherPayingCodeWithDebug(code1: string | null, code2: string | null, insurancePlan: string): {
  winningCode: string | null;
  comparison: {
    code1: string | null;
    code1Price: number;
    code2: string | null;
    code2Price: number;
    insurancePlan: string;
  } | null;
} {
  if (!code1 && !code2) {
    return { winningCode: null, comparison: null };
  }

  if (!code1) {
    return {
      winningCode: code2,
      comparison: {
        code1: null,
        code1Price: 0,
        code2: code2,
        code2Price: getReimbursement(insurancePlan, code2),
        insurancePlan
      }
    };
  }

  if (!code2) {
    return {
      winningCode: code1,
      comparison: {
        code1: code1,
        code1Price: getReimbursement(insurancePlan, code1),
        code2: null,
        code2Price: 0,
        insurancePlan
      }
    };
  }

  const code1Price = getReimbursement(insurancePlan, code1);
  const code2Price = getReimbursement(insurancePlan, code2);
  const winningCode = code1Price >= code2Price ? code1 : code2;

  return {
    winningCode,
    comparison: {
      code1,
      code1Price,
      code2,
      code2Price,
      insurancePlan
    }
  };
}

// Check if insurance name contains "medicare" or "medicaid" (case-insensitive)
export function isMedicareOrMedicaidInsurance(insuranceName: string): boolean {
  const lowerName = insuranceName.toLowerCase();
  return lowerName.includes('medicare') || lowerName.includes('medicaid');
}

// Get hardcoded fallback rates based on insurance type
export function getHardcodedFallbackRate(insuranceName: string, code: string): number {
  const isMedicareOrMedicaid = isMedicareOrMedicaidInsurance(insuranceName);
  const fallbackPlan = isMedicareOrMedicaid ? 'Medicare' : 'default_private_insurance';
  return CODE_REIMBURSEMENT[fallbackPlan]?.[code] ?? 0;
} 