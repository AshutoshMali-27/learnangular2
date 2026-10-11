import type { Option } from '@/components/form'

// Sample master data for UI work. Replaced by the real GetMaster responses when
// `masters.services.ts` is wired to the API; ids here are illustrative only.

export const MOCK_COUNTRIES: Option[] = [
  { value: '2', label: 'India' },
  { value: '10', label: 'United Arab Emirates' },
  { value: '11', label: 'United States' },
  { value: '12', label: 'United Kingdom' },
  { value: '13', label: 'Singapore' },
]

export const MOCK_STATES: Record<string, Option[]> = {
  '2': [
    { value: '201', label: 'Maharashtra' },
    { value: '202', label: 'Gujarat' },
    { value: '203', label: 'Karnataka' },
  ],
  '10': [
    { value: '1001', label: 'Dubai' },
    { value: '1002', label: 'Abu Dhabi' },
  ],
  '11': [
    { value: '1101', label: 'California' },
    { value: '1102', label: 'New York' },
  ],
  '12': [{ value: '1201', label: 'England' }],
  '13': [{ value: '1301', label: 'Singapore' }],
}

export const MOCK_CITIES: Record<string, Option[]> = {
  '201': [
    { value: '20101', label: 'Mumbai' },
    { value: '20102', label: 'Pune' },
  ],
  '202': [{ value: '20201', label: 'Ahmedabad' }],
  '203': [{ value: '20301', label: 'Bengaluru' }],
  '1001': [{ value: '100101', label: 'Dubai' }],
  '1002': [{ value: '100201', label: 'Abu Dhabi' }],
  '1101': [{ value: '110101', label: 'San Francisco' }],
  '1102': [{ value: '110201', label: 'New York' }],
  '1201': [{ value: '120101', label: 'London' }],
  '1301': [{ value: '130101', label: 'Singapore' }],
}

export const MOCK_RELATIONS: Option[] = [
  { value: '0', label: 'Self' },
  { value: '1', label: 'Spouse' },
  { value: '2', label: 'Dependent Child' },
  { value: '3', label: 'Dependent Parent' },
]

export const MOCK_ADMINS: Option[] = [
  { value: '9001', label: 'HO Admin - Mumbai' },
  { value: '9002', label: 'Regional Admin - West' },
  { value: '9003', label: 'Regional Admin - South' },
]

// value = dp_number, which becomes the DP ID.
export const MOCK_DPS: Option[] = [
  { value: 'IN300214', label: 'HDFC Bank Limited' },
  { value: 'IN301549', label: 'ICICI Bank Limited' },
  { value: 'IN300476', label: 'Kotak Mahindra Bank Limited' },
]

export const MOCK_KMP_DESIGNATIONS: Option[] = [
  { value: '1', label: 'Managing Director' },
  { value: '2', label: 'Chief Executive Officer' },
  { value: '3', label: 'Chief Financial Officer' },
  { value: '4', label: 'Company Secretary' },
]

export const MOCK_BRANCHES: Option[] = [
  { value: '501', label: 'Mumbai - Fort' },
  { value: '502', label: 'Mumbai - Andheri' },
  { value: '503', label: 'Pune - Camp' },
  { value: '504', label: 'Ahmedabad - CG Road' },
  { value: '505', label: 'Bengaluru - MG Road' },
]

// Ids 2, 3, 25, 26, 31 and 136 drive the FATCA employer / business / other blocks.
export const MOCK_OCCUPATIONS: Option[] = [
  { value: '2', label: 'Private Sector Service' },
  { value: '3', label: 'Public Sector Service' },
  { value: '26', label: 'Government Service' },
  { value: '136', label: 'Professional' },
  { value: '25', label: 'Business' },
  { value: '31', label: 'Others' },
  { value: '40', label: 'Retired' },
  { value: '41', label: 'Housewife' },
  { value: '42', label: 'Student' },
]

export const MOCK_INCOME_SLABS: Option[] = [
  { value: '1', label: 'Below 1 Lakh' },
  { value: '2', label: '1 - 5 Lakh' },
  { value: '3', label: '5 - 10 Lakh' },
  { value: '4', label: '10 - 25 Lakh' },
  { value: '5', label: 'Above 25 Lakh' },
]

// Code 08 (Others) asks for a description.
export const MOCK_SOURCES_OF_WEALTH: Option[] = [
  { value: '01', label: 'Salary' },
  { value: '02', label: 'Business Income' },
  { value: '03', label: 'Gift' },
  { value: '04', label: 'Ancestral Property' },
  { value: '05', label: 'Rental Income' },
  { value: '08', label: 'Others' },
]

export const MOCK_NATURE_OF_BUSINESS: Option[] = [
  { value: '1', label: 'Manufacturing' },
  { value: '2', label: 'Trading' },
  { value: '3', label: 'Services' },
  { value: '4', label: 'Real Estate' },
]

// value = country_code
export const MOCK_NATIONALITIES: Option[] = [
  { value: 'IN', label: 'Indian' },
  { value: 'US', label: 'American' },
  { value: 'GB', label: 'British' },
  { value: 'AE', label: 'Emirati' },
  { value: 'SG', label: 'Singaporean' },
  { value: 'CA', label: 'Canadian' },
  { value: 'AU', label: 'Australian' },
]

// value = country_id, meta.code = fatca_country_code (what TIN validation is called with).
export const MOCK_FATCA_COUNTRIES: Option<{ code: string }>[] = [
  { value: '2', label: 'India', meta: { code: 'IN' } },
  { value: '10', label: 'United Arab Emirates', meta: { code: 'AE' } },
  { value: '11', label: 'United States', meta: { code: 'US' } },
  { value: '12', label: 'United Kingdom', meta: { code: 'GB' } },
  { value: '13', label: 'Singapore', meta: { code: 'SG' } },
]

export const MOCK_FATCA_CITIES: Option[] = ['MUMBAI', 'PUNE', 'AHMEDABAD', 'BENGALURU', 'DELHI', 'CHENNAI'].map(
  (city) => ({ value: city, label: city }),
)

export interface DocumentTypeMeta {
  hasNumber: boolean
  hasIssueDate: boolean
  hasExpiryDate: boolean
  hasPlace: boolean
  isIdProof: boolean
  isAddressProof: boolean
  isBankProof: boolean
}

const doc = (
  value: string,
  label: string,
  flags: Partial<DocumentTypeMeta>,
): Option<DocumentTypeMeta> => ({
  value,
  label,
  meta: {
    hasNumber: true,
    hasIssueDate: false,
    hasExpiryDate: false,
    hasPlace: false,
    isIdProof: false,
    isAddressProof: false,
    isBankProof: false,
    ...flags,
  },
})

// Ids 3 (PAN), 5 (Passport) and 74 (Aadhaar) have special rules in the Proof and Nominee stages.
export const MOCK_DOCUMENT_TYPES: Option<DocumentTypeMeta>[] = [
  doc('3', 'PAN Card', { isIdProof: true }),
  doc('5', 'Passport', { hasIssueDate: true, hasExpiryDate: true, hasPlace: true, isIdProof: true, isAddressProof: true }),
  doc('74', 'Aadhaar Card', { isIdProof: true, isAddressProof: true }),
  doc('2', 'Driving Licence', { hasIssueDate: true, hasExpiryDate: true, isIdProof: true, isAddressProof: true }),
  doc('10', 'Bank Statement', { hasNumber: false, hasIssueDate: true, isAddressProof: true, isBankProof: true }),
  doc('12', 'Utility Bill', { hasIssueDate: true, isAddressProof: true }),
  doc('15', 'Salary Slip', { hasNumber: false, isBankProof: true }),
]

// Id 13 (Other) asks for a description.
export const MOCK_NOMINEE_RELATIONS: Option[] = [
  { value: '1', label: 'Spouse' },
  { value: '2', label: 'Son' },
  { value: '3', label: 'Daughter' },
  { value: '4', label: 'Father' },
  { value: '5', label: 'Mother' },
  { value: '6', label: 'Brother' },
  { value: '7', label: 'Sister' },
  { value: '13', label: 'Other' },
]
