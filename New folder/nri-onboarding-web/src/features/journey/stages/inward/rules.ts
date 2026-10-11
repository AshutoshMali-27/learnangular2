import type { Option } from '@/components/form'

// Business rules of the Inward stage as pure functions (Docs/UI/01-Inward.md §5).

export const NRI_TYPE = {
  NRE_PIS: 'NRE_PIS',
  NRE_NONPIS: 'NRE_NONPIS',
  NRO_PIS: 'NRO_PIS',
  NRO_NONPIS: 'NRO_NONPIS',
} as const

export const NRI_TYPE_OPTIONS: Option[] = [
  { value: NRI_TYPE.NRE_PIS, label: 'NRE PIS' },
  { value: NRI_TYPE.NRE_NONPIS, label: 'NRE NONPIS' },
  { value: NRI_TYPE.NRO_PIS, label: 'NRO PIS' },
  { value: NRI_TYPE.NRO_NONPIS, label: 'NRO NONPIS' },
]

export const NRI_WITH_OPTIONS: Option[] = [
  { value: 'I', label: 'Indian Passport' },
  { value: 'F', label: 'Foreign Passport' },
  { value: 'M', label: 'Mariner' },
]

const MARINER = 'M'
const RESIDENT_INDIVIDUAL = 'RI'

/** "Resident Individual" can be chosen only by a Mariner. */
export const residentialStatusOptions = (nriWith: string): Option[] => [
  { value: RESIDENT_INDIVIDUAL, label: 'Resident Individual', disabled: nriWith !== MARINER },
  { value: 'NRI', label: 'NRI' },
  { value: 'FI', label: 'Foreign National' },
  { value: 'PIO', label: 'Person of Indian Origin' },
]

export const isResidentialStatusAllowed = (status: string, nriWith: string) =>
  status !== RESIDENT_INDIVIDUAL || nriWith === MARINER

export const FATHER_SPOUSE_OPTIONS: Option[] = [
  { value: 'H', label: 'Spouse' },
  { value: 'F', label: 'Father' },
]

export const CONTRACT_NOTE_OPTIONS: Option[] = [
  { value: 'PHY', label: 'Physical' },
  { value: 'DIG', label: 'Digital' },
  { value: 'NA', label: 'NA' },
]

export const hasNre = (nriTypes: string[]) =>
  nriTypes.includes(NRI_TYPE.NRE_PIS) || nriTypes.includes(NRI_TYPE.NRE_NONPIS)

export const hasNro = (nriTypes: string[]) =>
  nriTypes.includes(NRI_TYPE.NRO_PIS) || nriTypes.includes(NRI_TYPE.NRO_NONPIS)

/** FNO can be offered only with an NRO NONPIS account. */
export const canTradeFno = (nriTypes: string[]) => nriTypes.includes(NRI_TYPE.NRO_NONPIS)

export interface Products {
  equity: boolean
  mutualFunds: boolean
  fno: boolean
}

/** Products follow from the NRI types; only FNO is the user's choice. */
export const deriveProducts = (nriTypes: string[], fno: boolean): Products => ({
  equity: nriTypes.includes(NRI_TYPE.NRE_PIS) || nriTypes.includes(NRI_TYPE.NRO_PIS),
  mutualFunds: nriTypes.includes(NRI_TYPE.NRE_NONPIS) || nriTypes.includes(NRI_TYPE.NRO_NONPIS),
  fno: fno && canTradeFno(nriTypes),
})

export const HOUSE_DP_NAME = 'SHAREKHAN LIMITED'

/** DP ID used when the client is not linking an existing DP account. */
export const defaultDpId = (accountWith: string) => (accountWith === 'CDSL' ? '12036000' : 'IN300513')

export interface PrefixDefaults {
  gender?: string
  maritalStatus?: string
  fatherOrSpouse?: string
}

/** Choosing a title pre-selects what it implies; the user can still change it. */
export function prefixDefaults(prefix: string): PrefixDefaults {
  switch (prefix) {
    case 'Mr.':
      return { gender: 'M', fatherOrSpouse: 'F' }
    case 'Mrs.':
      return { gender: 'F', maritalStatus: 'M', fatherOrSpouse: 'H' }
    case 'Miss':
      return { gender: 'F' }
    default:
      return {}
  }
}

/** Age in whole years from a dd/MM/yyyy date. */
export function ageFromDob(dob: string, today = new Date()): number {
  const [day, month, year] = dob.split('/').map(Number)
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  return today.getFullYear() - year - (hadBirthday ? 0 : 1)
}

export const MINIMUM_AGE = 18
