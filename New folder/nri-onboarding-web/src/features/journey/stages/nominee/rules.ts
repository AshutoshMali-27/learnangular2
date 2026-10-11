import { ageFromIso } from '@/lib/dates'
import { joinName } from '@/lib/names'
import type { JourneyProgress } from '../../types'

// Business rules of the Nominee stage (Docs/UI/06-Nominee.md §2–4).

export type NomineeAccount = 'NRE' | 'NRO'

export const MAX_NOMINEES_PER_ACCOUNT = 10
export const RELATION_OTHER = '13'
export const ADULT_AGE = 18

/** Proof types a nominee may give; a guardian's proof is always PAN. */
export const NOMINEE_PROOF_TYPE_IDS = ['3', '5', '74', '2']
export const PROOF_TYPE = { PAN: '3', PASSPORT: '5', AADHAAR: '74' } as const

export const PROOF_PATTERNS: Record<string, { pattern: RegExp; message: string }> = {
  [PROOF_TYPE.PAN]: { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Enter a valid PAN' },
  [PROOF_TYPE.PASSPORT]: { pattern: /^[A-PR-WY][1-9]\d{6}$/, message: 'Enter a valid passport number' },
  [PROOF_TYPE.AADHAAR]: { pattern: /^\d{12}$/, message: 'Enter the 12-digit Aadhaar number' },
}

/** Nominees are recorded separately for each account type the client opened in Inward. */
export const availableAccounts = ({ nriTypes }: JourneyProgress): NomineeAccount[] => [
  ...(nriTypes.nrePis || nriTypes.nreNonPis ? (['NRE'] as const) : []),
  ...(nriTypes.nroPis || nriTypes.nroNonPis ? (['NRO'] as const) : []),
]

/** A nominee under 18 needs a guardian. False while the date of birth is still empty. */
export const isMinor = (dob: string) => ageFromIso(dob) < ADULT_AGE

export const shareTotal = (nominees: { share: string }[]) =>
  nominees.reduce((total, nominee) => total + (Number(nominee.share) || 0), 0)

export const fullName = (name: { firstName: string; middleName: string; lastName: string }) =>
  joinName(name.firstName, name.middleName, name.lastName).toLowerCase()
