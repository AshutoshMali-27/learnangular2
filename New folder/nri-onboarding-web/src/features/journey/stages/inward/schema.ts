import { z } from 'zod'
import { isValidEmail, isValidPan, PATTERNS } from '@/lib/validators'
import { hasNre, hasNro, isResidentialStatusAllowed } from './rules'

const verifyStatus = z.enum(['idle', 'valid', 'invalid'])
const verified = (message: string) => verifyStatus.refine((status): boolean => status === 'valid', { message })
const required = (message: string) => z.string().min(1, message)

const dpSchema = z.object({ dpId: z.string(), clientId: z.string() })

export const inwardSchema = z
  .object({
    // Step 1: PAN & identity
    pan: z.string().refine(isValidPan, 'Enter a valid individual PAN'),
    panStatus: verified('Validate the PAN to continue'),
    dob: required('Date of birth is required'),
    nameAsPerPan: z.string(),
    panAadhaarSeeding: z.string(),
    name: z.object({
      prefix: required('Prefix is required'),
      firstName: required('First name is required'),
      middleName: z.string(),
      lastName: z.string(),
    }),

    // Step 2: personal
    nriWith: required('Select the passport type'),
    residentialStatus: required('Select the residential status'),
    gender: required('Select a gender'),
    maritalStatus: required('Select the marital status'),
    fatherOrSpouse: required('Select Father or Spouse'),
    fatherSpouseName: z.object({
      firstName: required('First name is required'),
      middleName: z.string(),
      lastName: z.string(),
    }),

    // Step 3: product
    nriTypes: z.array(z.string()).min(1, 'Select at least one NRI type'),
    fno: z.boolean(),
    accountType: z.string(),
    contractNote: required('Select the contract note type'),
    accountWith: z.string(),

    // Step 4: DP
    linkExistingDp: z.enum(['Y', 'N']),
    nreDp: dpSchema,
    nroDp: dpSchema,

    // Step 5: contact
    email: z.string().refine(isValidEmail, 'Enter a valid email ID'),
    emailStatus: verified('Validate the email ID to continue'),
    emailRelation: required('Email relationship is required'),
    mobile: z.string().regex(PATTERNS.mobile, 'Enter a valid mobile number'),
    mobileStatus: verified('Validate the mobile number to continue'),
    mobileRelation: required('Mobile relationship is required'),
    isdCode: z.string(),
    telephone: z.string(),

    // Step 6: branch
    preferredBranch: z.string(),
    admin: required('Admin name is required'),
    leadId: z.string(),
    leadStatus: verifyStatus,
    salesCode: required('Sales executive code is required'),
    salesStatus: verified('Validate the sales executive code to continue'),
    hni: z.boolean(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: 'custom', path: path.split('.'), message })

    if (!isResidentialStatusAllowed(values.residentialStatus, values.nriWith)) {
      issue('residentialStatus', 'Resident Individual is available only for Mariner')
    }

    // An existing DP needs its name and an 8-digit client id for each side being opened.
    if (values.linkExistingDp === 'Y') {
      const sides = [
        { key: 'nreDp', selected: hasNre(values.nriTypes), dp: values.nreDp, label: 'NRE' },
        { key: 'nroDp', selected: hasNro(values.nriTypes), dp: values.nroDp, label: 'NRO' },
      ]
      for (const { key, selected, dp, label } of sides) {
        if (!selected) continue
        if (!dp.dpId) issue(`${key}.dpId`, `Select the ${label} DP`)
        if (!/^\d{8}$/.test(dp.clientId)) issue(`${key}.clientId`, `${label} client ID must be 8 digits`)
      }
    }

    // Lead ID is optional, but once entered it has to be validated.
    if (values.leadId && values.leadStatus !== 'valid') {
      issue('leadStatus', 'Validate the lead ID or clear it')
    }
  })

export type InwardValues = z.infer<typeof inwardSchema>

export const INWARD_DEFAULTS: InwardValues = {
  pan: '',
  panStatus: 'idle',
  dob: '',
  nameAsPerPan: '',
  panAadhaarSeeding: '',
  name: { prefix: '', firstName: '', middleName: '', lastName: '' },
  nriWith: '',
  residentialStatus: 'NRI',
  gender: '',
  maritalStatus: '',
  fatherOrSpouse: '',
  fatherSpouseName: { firstName: '', middleName: '', lastName: '' },
  nriTypes: [],
  fno: false,
  accountType: 'I',
  contractNote: '',
  accountWith: 'NSDL',
  linkExistingDp: 'N',
  nreDp: { dpId: '', clientId: '' },
  nroDp: { dpId: '', clientId: '' },
  email: '',
  emailStatus: 'idle',
  emailRelation: '',
  mobile: '',
  mobileStatus: 'idle',
  mobileRelation: '',
  isdCode: '',
  telephone: '',
  preferredBranch: '',
  admin: '',
  leadId: '',
  leadStatus: 'idle',
  salesCode: '',
  salesStatus: 'idle',
  hni: false,
}

/** Fields validated when leaving each wizard step. */
export const INWARD_STEP_FIELDS = {
  identity: ['pan', 'panStatus', 'dob', 'name'],
  personal: ['nriWith', 'residentialStatus', 'gender', 'maritalStatus', 'fatherOrSpouse', 'fatherSpouseName'],
  product: ['nriTypes', 'contractNote'],
  dp: ['linkExistingDp', 'nreDp', 'nroDp'],
  contact: ['email', 'emailStatus', 'emailRelation', 'mobile', 'mobileStatus', 'mobileRelation'],
  branch: ['admin', 'leadStatus', 'salesCode', 'salesStatus'],
} satisfies Record<string, (keyof InwardValues)[]>
