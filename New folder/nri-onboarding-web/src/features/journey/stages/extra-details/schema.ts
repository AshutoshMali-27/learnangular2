import { z } from 'zod'
import { todayIso } from '@/lib/dates'

const fileSchema = z.object({ filePath: z.string(), fileName: z.string() }).nullable()

/** One staff verification block: who verified, when, and their signature. */
const staffSchema = z.object({
  staffCode: z.string(),
  name: z.string(),
  designation: z.string(),
  date: z.string(),
  signature: fileSchema,
})

export type StaffVerification = z.infer<typeof staffSchema>

export const EMPTY_STAFF: StaffVerification = {
  staffCode: '',
  name: '',
  designation: '',
  date: '',
  signature: null,
}

export type StaffBlockKey = 'osv' | 'interview' | 'ipv'

export const STAFF_BLOCKS: { key: StaffBlockKey; title: string; codeLabel: string; required: boolean }[] = [
  { key: 'osv', title: 'OSV Verification', codeLabel: 'OSV Staff Code', required: true },
  { key: 'interview', title: 'Interview Details', codeLabel: 'Interviewer Staff Code', required: false },
  { key: 'ipv', title: 'IPV Approval', codeLabel: 'IPV Approval Code', required: true },
]

export const extraDetailsSchema = z
  .object({
    countryOfResidence: z.string(),
    countrySourceIncome: z.string(),
    investmentThroughSharekhan: z
      .string()
      .regex(/^(\d+(\.\d{1,2})?)?$/, 'Enter an amount with up to 2 decimals'),
    natureOfBusiness: z.string(),
    kmpDesignationId: z.string(),
    kmpDesignationDescription: z.string(),
    formerAliasName: z.string(),
    citizenship: z.string(),
    accessInsiderInfo: z.string(),
    accessInsiderInfoRemark: z.string(),
    sensitiveProductServices: z.string(),
    isBankAvailable: z.string().min(1, 'Choose Yes or No'),
    hasPriorExperience: z.boolean(),
    experienceYears: z.number(),
    derivativesYears: z.number(),
    otherInvestmentYears: z.number(),

    osv: staffSchema,
    interview: staffSchema,
    interviewPlace: z.string(),
    ipv: staffSchema,
    factiva: fileSchema,
  })
  .superRefine((values, context) => {
    const issue = (path: string[], message: string) => context.addIssue({ code: 'custom', path, message })

    if (values.hasPriorExperience && values.experienceYears < 1) {
      issue(['experienceYears'], 'Enter the years of experience')
    }

    for (const { key, title, required } of STAFF_BLOCKS) {
      const block = values[key]
      if (block.date && block.date > todayIso()) issue([key, 'date'], 'Date cannot be in the future')
      if (!required) continue
      if (!block.staffCode.trim()) issue([key, 'staffCode'], 'Staff code is required')
      if (!block.name.trim()) issue([key, 'name'], 'Name is required')
      if (!block.designation.trim()) issue([key, 'designation'], 'Designation is required')
      if (!block.date) issue([key, 'date'], 'Date is required')
      if (!block.signature) issue([key, 'signature'], `Upload the ${title.toLowerCase()} signature`)
    }
  })

export type ExtraDetailsValues = z.infer<typeof extraDetailsSchema>

export const EXTRA_DETAILS_DEFAULTS: ExtraDetailsValues = {
  countryOfResidence: '',
  countrySourceIncome: '',
  investmentThroughSharekhan: '',
  natureOfBusiness: '',
  kmpDesignationId: '',
  kmpDesignationDescription: '',
  formerAliasName: '',
  citizenship: '',
  accessInsiderInfo: '',
  accessInsiderInfoRemark: '',
  sensitiveProductServices: '',
  isBankAvailable: '',
  hasPriorExperience: false,
  experienceYears: 0,
  derivativesYears: 0,
  otherInvestmentYears: 0,
  osv: EMPTY_STAFF,
  interview: EMPTY_STAFF,
  interviewPlace: '',
  ipv: EMPTY_STAFF,
  factiva: null,
}

export const EXTRA_DETAILS_STEP_FIELDS = {
  details: [
    'countryOfResidence', 'countrySourceIncome', 'investmentThroughSharekhan', 'natureOfBusiness',
    'kmpDesignationId', 'kmpDesignationDescription', 'formerAliasName', 'citizenship', 'accessInsiderInfo',
    'accessInsiderInfoRemark', 'sensitiveProductServices', 'isBankAvailable', 'hasPriorExperience',
    'experienceYears', 'derivativesYears', 'otherInvestmentYears',
  ],
  verification: ['osv', 'interview', 'interviewPlace', 'ipv', 'factiva'],
} satisfies Record<string, (keyof ExtraDetailsValues)[]>
