import type { Option } from '@/components/form'
import { INDIA_COUNTRY_ID } from '@/features/masters'

// Business rules of the FATCA stage (Docs/UI/04-Fatca.md §3–4).

export const FATCA_HOLDER_TYPES = ['TRD', '2ND', '3RD'] as const
export const fatcaHolderTypeAt = (index: number) => FATCA_HOLDER_TYPES[index] ?? '3RD'
export const fatcaHolderLabelAt = (index: number) =>
  ['Primary applicant', 'Second holder', 'Third holder'][index] ?? 'Holder'

export const PEP_OPTIONS: Option[] = [
  { value: '8', label: 'Non PEP' },
  { value: '1', label: 'PEP' },
  { value: '2', label: 'Relative of PEP' },
  { value: '3', label: 'Bureaucrat' },
  { value: '4', label: 'Civil Servant' },
  { value: '5', label: 'Politician' },
  { value: '6', label: 'Current / Former MP, MLA or MLC' },
  { value: '7', label: 'Current / Former Head of State' },
]

export const PEP = '1'
export const SOURCE_OF_WEALTH_OTHER = '08'
export const MARINER = 'M'
export const MAX_TAX_RESIDENCIES = 3

export interface OccupationBlocks {
  employer: boolean
  business: boolean
  other: boolean
}

const EMPLOYED = ['2', '3', '26', '136']
const BUSINESS = '25'
const OTHER = '31'

/** Extra occupation details are asked only of the primary applicant. */
export function occupationBlocks(occupationId: string, isPrimary: boolean): OccupationBlocks {
  if (!isPrimary) return { employer: false, business: false, other: false }
  return {
    employer: EMPLOYED.includes(occupationId) || occupationId === BUSINESS,
    business: occupationId === BUSINESS,
    other: occupationId === OTHER,
  }
}

/** A primary applicant cannot be resident in India unless they are a Mariner. */
export const isResidenceAllowed = (countryId: string, isPrimary: boolean, nriCategory: string) =>
  !isPrimary || countryId !== INDIA_COUNTRY_ID || nriCategory === MARINER

export const isBornInIndia = (countryId: string) => countryId === INDIA_COUNTRY_ID
