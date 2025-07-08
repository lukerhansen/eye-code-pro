// Insurance reimbursement rates by plan and code
export const CODE_REIMBURSEMENT: Record<string, Record<string, number>> = {
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
  VA: {
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
  'Humana Choice': {
    '92002': 75.21,
    '92004': 137.27,
    '92012': 68.81,
    '92014': 101.88,
    '99202': 68.99,
    '99203': 102.58,
    '99204': 145.40,
    '99212': 40.72,
    '99213': 55.77,
    '99214': 87.55,
    '99215': 127.67,
    '99205': 184.46,
  },
  'Humana Medicare': {
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
  Other: false,
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
  return CODE_REIMBURSEMENT[insurancePlan]?.[code] ?? 0;
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