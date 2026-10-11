import { z } from 'zod'
import {
  addressFields,
  addressSchema,
  EMPTY_ADDRESS,
  type AddressValues,
} from '@/components/shared/address/address.schema'

export const addressStageSchema = z
  .object({
    permanent: addressSchema,
    sameAsPermanent: z.boolean(),
    // Checked below only when it is entered separately.
    correspondence: z.record(z.string(), z.string()),
  })
  .superRefine((values, context) => {
    if (values.sameAsPermanent) return
    const result = addressSchema.safeParse(values.correspondence)
    if (result.success) return
    for (const issue of result.error.issues) {
      context.addIssue({
        code: 'custom',
        message: issue.message,
        path: ['correspondence', ...issue.path],
      })
    }
  })

export interface AddressStageValues {
  permanent: AddressValues
  sameAsPermanent: boolean
  correspondence: AddressValues
}

export const ADDRESS_STAGE_DEFAULTS: AddressStageValues = {
  permanent: EMPTY_ADDRESS,
  sameAsPermanent: false,
  correspondence: EMPTY_ADDRESS,
}

export const ADDRESS_STEP_FIELDS = {
  permanent: addressFields('permanent'),
  correspondence: addressFields('correspondence'),
}
