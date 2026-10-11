import { z } from 'zod'
import {
  addressFields,
  addressSchema,
  checkCorrespondence,
  EMPTY_ADDRESS,
  looseAddress,
  type AddressValues,
} from '@/components/shared/address/address.schema'
import { isValidEmail, isValidPan, PATTERNS } from '@/lib/validators'

export const MAX_HOLDERS = 2

/** Joint holders are the 2nd and 3rd holder; the client is the 1st (`TRD`). */
export const holderTypeAt = (index: number) => (index === 0 ? '2ND' : '3RD')
export const holderLabelAt = (index: number) => (index === 0 ? 'Second holder' : 'Third holder')

const verifyStatus = z.enum(['idle', 'valid', 'invalid'])
const verified = (message: string) => verifyStatus.refine((status): boolean => status === 'valid', { message })
const required = (message: string) => z.string().min(1, message)
const optionalName = z.object({ firstName: z.string(), middleName: z.string(), lastName: z.string() })

export const holderSchema = z
  .object({
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

    residentialStatus: required('Select the residential status'),
    gender: required('Select a gender'),
    maritalStatus: required('Select the marital status'),
    fatherOrSpouse: required('Select Father or Spouse'),
    fatherSpouseName: z.object({
      prefix: required('Prefix is required'),
      firstName: z.string().trim().min(2, 'Enter at least 2 characters'),
      middleName: z.string(),
      lastName: z.string(),
    }),
    motherName: optionalName,
    maidenName: optionalName.extend({ prefix: z.string() }),

    email: z.string().refine(isValidEmail, 'Enter a valid email ID'),
    emailStatus: verified('Validate the email ID to continue'),
    emailRelation: required('Email relationship is required'),
    mobile: z.string().regex(PATTERNS.mobile, 'Enter a valid mobile number'),
    mobileStatus: verified('Validate the mobile number to continue'),
    mobileRelation: required('Mobile relationship is required'),

    permanent: addressSchema,
    sameAsPermanent: z.boolean(),
    correspondence: looseAddress,
  })
  .superRefine(checkCorrespondence)

export type HolderRecord = Omit<z.infer<typeof holderSchema>, 'correspondence'> & {
  correspondence: AddressValues
}

export const HOLDER_DEFAULTS: HolderRecord = {
  pan: '',
  panStatus: 'idle',
  dob: '',
  nameAsPerPan: '',
  panAadhaarSeeding: '',
  name: { prefix: '', firstName: '', middleName: '', lastName: '' },
  residentialStatus: '',
  gender: '',
  maritalStatus: '',
  fatherOrSpouse: '',
  fatherSpouseName: { prefix: '', firstName: '', middleName: '', lastName: '' },
  motherName: { firstName: '', middleName: '', lastName: '' },
  maidenName: { prefix: '', firstName: '', middleName: '', lastName: '' },
  email: '',
  emailStatus: 'idle',
  emailRelation: '',
  mobile: '',
  mobileStatus: 'idle',
  mobileRelation: '',
  permanent: EMPTY_ADDRESS,
  sameAsPermanent: false,
  correspondence: EMPTY_ADDRESS,
}

export const HOLDER_STEP_FIELDS = {
  identity: ['pan', 'panStatus', 'dob', 'name'],
  personal: ['residentialStatus', 'gender', 'maritalStatus', 'fatherOrSpouse', 'fatherSpouseName'],
  contact: ['email', 'emailStatus', 'emailRelation', 'mobile', 'mobileStatus', 'mobileRelation'],
  permanent: addressFields('permanent'),
  correspondence: addressFields('correspondence'),
}

/** What is shown and edited on the Holder stage. */
export interface HolderStageView {
  holders: HolderRecord[]
}
