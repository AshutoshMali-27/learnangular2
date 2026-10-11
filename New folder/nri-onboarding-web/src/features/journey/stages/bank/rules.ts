import type { JourneyProgress } from '../../types'

// Which bank accounts a form needs, as data (Docs/UI/11-BankDetails.md §2–3).

export interface BankAccountConfig {
  /** `NriType` sent to the backend, also the form key of the account. */
  code: string
  label: string
  /** PIS accounts need the RBI approval reference and date. */
  requireRbi: boolean
  /** A type with one account always uses it as the default. */
  alwaysDefault: boolean
}

export interface BankTypeConfig {
  key: keyof JourneyProgress['nriTypes']
  title: string
  accounts: BankAccountConfig[]
}

const pis = (code: string, label: string): BankAccountConfig => ({
  code,
  label,
  requireRbi: true,
  alwaysDefault: false,
})
const nonPis = (code: string): BankAccountConfig => ({
  code,
  label: 'Primary account',
  requireRbi: false,
  alwaysDefault: true,
})

export const BANK_TYPES: BankTypeConfig[] = [
  {
    key: 'nrePis',
    title: 'NRE PIS',
    accounts: [pis('NREPIS', 'Primary (PIS) account'), pis('NRENPIS', 'NRE SB account')],
  },
  { key: 'nreNonPis', title: 'NRE NON-PIS', accounts: [nonPis('NRENONPIS')] },
  {
    key: 'nroPis',
    title: 'NRO PIS',
    accounts: [pis('NROPIS', 'Primary (PIS) account'), pis('NRONPIS', 'NRO SB account')],
  },
  { key: 'nroNonPis', title: 'NRO NON-PIS', accounts: [nonPis('NRONONPIS')] },
]

/** Only the account types the client opened in Inward need bank details. */
export const enabledBankTypes = (progress: JourneyProgress) =>
  BANK_TYPES.filter((type) => progress.nriTypes[type.key])

/** Savings is the only account type offered. */
export const SAVINGS = '0'
export const ACCOUNT_TYPES = [{ value: SAVINGS, label: 'Savings' }]
