import { z } from 'zod'
import { INDIA_COUNTRY_ID } from '@/features/masters'
import { shiftedIso, todayIso } from '@/lib/dates'
import {
  isResidenceAllowed,
  MAX_TAX_RESIDENCIES,
  occupationBlocks,
  PEP,
  SOURCE_OF_WEALTH_OTHER,
} from './rules'

const required = (message: string) => z.string().min(1, message)
const fileSchema = z.object({ filePath: z.string(), fileName: z.string() }).nullable()

const residencySchema = z.object({
  fromDate: z.string(),
  countryId: z.string(),
  tin: z.string(),
  tinStatus: z.enum(['idle', 'valid', 'invalid']),
  proof: fileSchema,
})

export type TaxResidency = z.infer<typeof residencySchema>

export const EMPTY_RESIDENCY: TaxResidency = {
  fromDate: '',
  countryId: '',
  tin: '',
  tinStatus: 'idle',
  proof: null,
}

const isStarted = (row: TaxResidency) => Boolean(row.countryId || row.tin || row.proof)

interface FatcaContext {
  /** The primary applicant (`TRD`) has extra occupation, residence and PEP rules. */
  isPrimary: boolean
  nriCategory: string
}

export const createFatcaSchema = ({ isPrimary, nriCategory }: FatcaContext) =>
  z
    .object({
      countryOfBirth: required('Country of birth is required'),
      placeOfBirth: z.string(),
      occupation: required('Occupation is required'),
      employerName: z.string(),
      employerCountry: z.string(),
      employerAddress: z.string(),
      natureOfBusiness: z.string(),
      otherOccupation: z.string(),
      countryOfResidence: required('Country of residence is required'),
      incomeSlab: required('Income slab is required'),
      sourceOfWealth: required('Source of wealth is required'),
      sourceOfWealthOther: z.string(),
      netWorth: z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with up to 2 decimals')
        .refine((value) => Number(value) > 0, 'Net worth must be greater than 0'),
      netWorthDate: required('Net worth date is required').refine(
        (date) => date >= shiftedIso({ years: -1 }) && date <= todayIso(),
        'Date must be within the last year',
      ),
      nationality: required('Nationality is required'),
      citizenship: required('Citizenship is required'),

      pep: required('Select the PEP status'),
      pepDocument: fileSchema,
      usPerson: required('Choose Yes or No'),

      hasForeignTaxResidency: required('Choose Yes or No'),
      residencies: z.array(residencySchema).length(MAX_TAX_RESIDENCIES),
    })
    .superRefine((values, context) => {
      const issue = (path: (string | number)[], message: string) =>
        context.addIssue({ code: 'custom', path, message })

      const blocks = occupationBlocks(values.occupation, isPrimary)
      if (blocks.employer) {
        if (!values.employerName.trim()) issue(['employerName'], 'Employer name is required')
        if (!values.employerCountry) issue(['employerCountry'], 'Employer country is required')
        if (!values.employerAddress.trim()) issue(['employerAddress'], 'Employer address is required')
      }
      if (blocks.business && !values.natureOfBusiness) {
        issue(['natureOfBusiness'], 'Nature of business is required')
      }
      if (blocks.other && !values.otherOccupation.trim()) {
        issue(['otherOccupation'], 'Describe the occupation')
      }

      if (values.countryOfResidence && !isResidenceAllowed(values.countryOfResidence, isPrimary, nriCategory)) {
        issue(['countryOfResidence'], 'India is allowed only for a Mariner')
      }
      if (values.sourceOfWealth === SOURCE_OF_WEALTH_OTHER && !values.sourceOfWealthOther.trim()) {
        issue(['sourceOfWealthOther'], 'Describe the source of wealth')
      }
      if (isPrimary && values.pep === PEP && !values.pepDocument) {
        issue(['pepDocument'], 'Upload the compliance approval for a PEP')
      }

      if (values.hasForeignTaxResidency !== 'Y') return
      values.residencies.forEach((row, index) => {
        // The first country is mandatory; later rows only once the user starts them.
        if (index > 0 && !isStarted(row)) return
        const at = (field: string) => ['residencies', index, field]
        if (!row.countryId) issue(at('countryId'), 'Country is required')
        else if (row.countryId === INDIA_COUNTRY_ID) issue(at('countryId'), 'India cannot be selected here')
        if (!row.tin.trim()) issue(at('tin'), 'TIN is required')
        if (!row.proof) issue(at('proof'), 'Upload the TIN proof')
        if (row.tinStatus !== 'valid') issue(at('tinStatus'), 'Validate the TIN to continue')
      })
    })

export type FatcaRecord = z.infer<ReturnType<typeof createFatcaSchema>>

export const FATCA_DEFAULTS: FatcaRecord = {
  countryOfBirth: '',
  placeOfBirth: '',
  occupation: '',
  employerName: '',
  employerCountry: '',
  employerAddress: '',
  natureOfBusiness: '',
  otherOccupation: '',
  countryOfResidence: '',
  incomeSlab: '',
  sourceOfWealth: '',
  sourceOfWealthOther: '',
  netWorth: '',
  netWorthDate: '',
  nationality: '',
  citizenship: '',
  pep: '',
  pepDocument: null,
  usPerson: '',
  hasForeignTaxResidency: '',
  residencies: [EMPTY_RESIDENCY, EMPTY_RESIDENCY, EMPTY_RESIDENCY],
}

export const FATCA_STEP_FIELDS = {
  profile: [
    'countryOfBirth', 'placeOfBirth', 'occupation', 'employerName', 'employerCountry', 'employerAddress',
    'natureOfBusiness', 'otherOccupation', 'countryOfResidence', 'incomeSlab', 'sourceOfWealth',
    'sourceOfWealthOther', 'netWorth', 'netWorthDate', 'nationality', 'citizenship',
  ],
  declarations: ['pep', 'pepDocument', 'usPerson'],
  taxResidency: ['hasForeignTaxResidency', 'residencies'],
} satisfies Record<string, (keyof FatcaRecord)[]>

export interface FatcaStageView {
  records: FatcaRecord[]
}
