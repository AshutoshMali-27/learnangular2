import { z } from 'zod'
import {
  addressFields,
  addressSchema,
  EMPTY_ADDRESS,
  looseAddress,
  type AddressValues,
} from '@/components/shared/address/address.schema'
import { ageFromIso, shiftedIso } from '@/lib/dates'
import { isValidEmail, PATTERNS } from '@/lib/validators'
import { ADULT_AGE, fullName, isMinor, PROOF_PATTERNS, PROOF_TYPE, RELATION_OTHER } from './rules'

const fileSchema = z.object({ filePath: z.string(), fileName: z.string() }).nullable()
const nameSchema = z.object({
  prefix: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
})

// Guardian fields are plain strings here and enforced below only when the nominee is a minor.
const guardianSchema = z.object({
  proofNumber: z.string(),
  name: nameSchema,
  dob: z.string(),
  relationId: z.string(),
  relationOther: z.string(),
  address: looseAddress,
  mobile: z.string(),
  telephone: z.string(),
  email: z.string(),
  proof: fileSchema,
})

const baseSchema = z.object({
  proofTypeId: z.string().min(1, 'Proof type is required'),
  proofNumber: z.string().min(1, 'Proof number is required'),
  name: nameSchema,
  dob: z.string().min(1, 'Date of birth is required'),
  share: z.string(),
  relationId: z.string().min(1, 'Relationship is required'),
  relationOther: z.string(),
  address: addressSchema,
  mobile: z.string().regex(PATTERNS.mobile, 'Enter a valid mobile number'),
  telephone: z.string(),
  email: z.string().refine(isValidEmail, 'Enter a valid email ID'),
  proof: fileSchema,
  guardian: guardianSchema,
})

type Guardian = Omit<z.infer<typeof guardianSchema>, 'address'> & { address: AddressValues }
export type NomineeRecord = Omit<z.infer<typeof baseSchema>, 'guardian'> & { guardian: Guardian }

interface NomineeContext {
  /** The client's PAN can be neither a nominee's nor a guardian's proof. */
  clientPan: string
  /** Other nominees of the same account, for the share total and duplicate checks. */
  others: NomineeRecord[]
  /** Shares already given to those other nominees. */
  othersShare: number
}

type Path = (string | number)[]

export const createNomineeSchema = ({ clientPan, others, othersShare }: NomineeContext) =>
  baseSchema.superRefine((nominee, context) => {
    const issue = (path: Path, message: string) => context.addIssue({ code: 'custom', path, message })
    const proofNumber = nominee.proofNumber.trim().toUpperCase()

    const proofRule = PROOF_PATTERNS[nominee.proofTypeId]
    if (proofNumber && proofRule && !proofRule.pattern.test(proofNumber)) issue(['proofNumber'], proofRule.message)
    if (proofNumber && proofNumber === clientPan) issue(['proofNumber'], 'The client cannot be their own nominee')

    if (!nominee.name.prefix) issue(['name', 'prefix'], 'Prefix is required')
    if (!nominee.name.firstName.trim()) issue(['name', 'firstName'], 'First name is required')
    if (nominee.dob && nominee.dob > shiftedIso({ days: -1 })) issue(['dob'], 'Date of birth must be in the past')

    const share = Number(nominee.share)
    if (!/^\d+$/.test(nominee.share) || share < 1 || share > 100) {
      issue(['share'], 'Enter a share between 1 and 100')
    } else if (othersShare + share > 100) {
      issue(['share'], `Only ${100 - othersShare}% is left to allocate for this account`)
    }
    if (nominee.relationId === RELATION_OTHER && !nominee.relationOther.trim()) {
      issue(['relationOther'], 'Describe the relationship')
    }

    // The same person cannot be nominated twice for one account.
    for (const other of others) {
      if (other.proofNumber.toUpperCase() === proofNumber) issue(['proofNumber'], 'Another nominee has this proof number')
      if (other.email.toLowerCase() === nominee.email.toLowerCase()) issue(['email'], 'Another nominee has this email ID')
      if (other.mobile === nominee.mobile) issue(['mobile'], 'Another nominee has this mobile number')
      if (fullName(other.name) === fullName(nominee.name)) issue(['name', 'firstName'], 'Another nominee has this name')
    }

    if (!isMinor(nominee.dob)) return
    const { guardian } = nominee
    const at = (...path: Path) => ['guardian', ...path]
    const guardianProof = guardian.proofNumber.trim().toUpperCase()

    if (!PROOF_PATTERNS[PROOF_TYPE.PAN].pattern.test(guardianProof)) {
      issue(at('proofNumber'), 'Enter the guardian’s PAN')
    } else if (guardianProof === proofNumber) {
      issue(at('proofNumber'), 'Guardian and nominee cannot share a proof number')
    } else if (guardianProof === clientPan) {
      issue(at('proofNumber'), 'The client cannot be the guardian')
    }
    if (!guardian.name.prefix) issue(at('name', 'prefix'), 'Prefix is required')
    if (!guardian.name.firstName.trim()) issue(at('name', 'firstName'), 'First name is required')
    if (!guardian.dob) issue(at('dob'), 'Date of birth is required')
    else if (ageFromIso(guardian.dob) < ADULT_AGE) issue(at('dob'), 'A guardian must be 18 or older')
    if (!guardian.relationId) issue(at('relationId'), 'Relationship is required')
    if (guardian.relationId === RELATION_OTHER && !guardian.relationOther.trim()) {
      issue(at('relationOther'), 'Describe the relationship')
    }

    const address = addressSchema.safeParse(guardian.address)
    if (!address.success) {
      for (const item of address.error.issues) issue(at('address', ...(item.path as Path)), item.message)
    }
    if (!PATTERNS.mobile.test(guardian.mobile)) issue(at('mobile'), 'Enter a valid mobile number')
    else if (guardian.mobile === nominee.mobile) issue(at('mobile'), 'Guardian and nominee need different mobile numbers')
    if (!isValidEmail(guardian.email)) issue(at('email'), 'Enter a valid email ID')
    else if (guardian.email.toLowerCase() === nominee.email.toLowerCase()) {
      issue(at('email'), 'Guardian and nominee need different email IDs')
    }
    if (!guardian.proof) issue(at('proof'), 'Upload the guardian’s proof')
  })

const EMPTY_NAME = { prefix: '', firstName: '', middleName: '', lastName: '' }

export const NOMINEE_DEFAULTS: NomineeRecord = {
  proofTypeId: '',
  proofNumber: '',
  name: EMPTY_NAME,
  dob: '',
  share: '',
  relationId: '',
  relationOther: '',
  address: EMPTY_ADDRESS,
  mobile: '',
  telephone: '',
  email: '',
  proof: null,
  guardian: {
    proofNumber: '',
    name: EMPTY_NAME,
    dob: '',
    relationId: '',
    relationOther: '',
    address: EMPTY_ADDRESS,
    mobile: '',
    telephone: '',
    email: '',
    proof: null,
  },
}

export const NOMINEE_STEP_FIELDS = {
  info: ['proofTypeId', 'proofNumber', 'name', 'dob', 'share', 'relationId', 'relationOther'],
  contact: [...addressFields('address'), 'mobile', 'telephone', 'email', 'proof'],
  guardianInfo: [
    'guardian.proofNumber',
    'guardian.name',
    'guardian.dob',
    'guardian.relationId',
    'guardian.relationOther',
  ],
  guardianContact: [
    ...addressFields('guardian.address'),
    'guardian.mobile',
    'guardian.telephone',
    'guardian.email',
    'guardian.proof',
  ],
}

export interface NomineeStageView {
  optIn: 'Y' | 'N' | ''
  nominees: Record<string, NomineeRecord[]>
}
