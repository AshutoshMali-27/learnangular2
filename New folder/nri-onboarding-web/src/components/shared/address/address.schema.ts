import { z } from 'zod'
import { FOREIGN_PINCODE, INDIA_COUNTRY_ID } from '@/features/masters/constants'
import { PATTERNS } from '@/lib/validators'

// One address rule set for every stage. The MVC pages had drifted (3–50 on Address, 3–70 on
// Holder with maxlength 50); 50 is what the inputs actually allowed.
export const ADDRESS_LINE_MAX = 50
/** Landmark and district. */
export const ADDRESS_SHORT_MAX = 40

const addressLine = z
  .string()
  .trim()
  .max(ADDRESS_LINE_MAX, `Maximum ${ADDRESS_LINE_MAX} characters`)

export const addressSchema = z
  .object({
    line1: addressLine
      .min(3, 'Address line 1 must be at least 3 characters')
      .refine((value) => !/^\d+$/.test(value), 'Address cannot be only digits'),
    line2: addressLine,
    line3: addressLine,
    landmark: z.string().trim().max(ADDRESS_SHORT_MAX),
    countryId: z.string().min(1, 'Country is required'),
    stateId: z.string().min(1, 'State is required'),
    cityId: z.string().min(1, 'City is required'),
    district: z.string().trim().max(ADDRESS_SHORT_MAX),
    pincode: z.string(),
  })
  .superRefine((address, context) => {
    const isIndia = address.countryId === INDIA_COUNTRY_ID
    const valid = isIndia ? PATTERNS.pincode.test(address.pincode) : address.pincode === FOREIGN_PINCODE
    if (!valid) {
      context.addIssue({
        code: 'custom',
        path: ['pincode'],
        message: isIndia ? 'Enter a valid 6-digit pincode' : `Pincode must be ${FOREIGN_PINCODE}`,
      })
    }
  })

export type AddressValues = z.infer<typeof addressSchema>

export const EMPTY_ADDRESS: AddressValues = {
  line1: '',
  line2: '',
  line3: '',
  landmark: '',
  countryId: '',
  stateId: '',
  cityId: '',
  district: '',
  pincode: '',
}

/** Field paths of one address, for a wizard step's `fields` list. */
export const addressFields = (name: string) =>
  Object.keys(EMPTY_ADDRESS).map((key) => `${name}.${key}`)

/** The correspondence block as a form holds it: loose, so it can be ignored when unused. */
export const looseAddress = z.record(z.string(), z.string())

/** Validates `correspondence` only when it is entered separately. Call from a superRefine. */
export function checkCorrespondence(
  values: { sameAsPermanent: boolean; correspondence: Record<string, string> },
  context: z.RefinementCtx,
) {
  if (values.sameAsPermanent) return
  const result = addressSchema.safeParse(values.correspondence)
  if (result.success) return
  for (const issue of result.error.issues) {
    context.addIssue({ code: 'custom', message: issue.message, path: ['correspondence', ...issue.path] })
  }
}
