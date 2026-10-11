import { z } from 'zod'
import type { DocumentTypeMeta } from '@/features/masters'
import { shiftedIso, todayIso } from '@/lib/dates'
import { PATTERNS } from '@/lib/validators'
import { DOC_TYPE, MASKED_AADHAAR } from './rules'

/** Which fields a document needs depends on its type, so the schema is built from the master. */
export const createDocumentSchema = (metaOf: (docTypeId: string) => DocumentTypeMeta | undefined) =>
  z
    .object({
      docTypeId: z.string().min(1, 'Document type is required'),
      docTypeName: z.string(),
      categories: z.array(z.string()).min(1, 'Select at least one proof category'),
      number: z.string(),
      validFrom: z.string(),
      validTo: z.string(),
      place: z.string(),
      file: z
        .object({ filePath: z.string(), fileName: z.string() })
        .nullable()
        .refine((file) => file !== null, 'Upload the document'),
    })
    .superRefine((document, context) => {
      const meta = metaOf(document.docTypeId)
      if (!meta) return
      const issue = (path: string, message: string) => context.addIssue({ code: 'custom', path: [path], message })
      const number = document.number.trim()

      if (meta.hasNumber) {
        if (!number) issue('number', 'Document number is required')
        else if (document.docTypeId === DOC_TYPE.PAN && !PATTERNS.pan.test(number)) {
          issue('number', 'Enter a valid individual PAN')
        } else if (
          document.docTypeId === DOC_TYPE.AADHAAR &&
          !PATTERNS.aadhaar.test(number) &&
          !MASKED_AADHAAR.test(number)
        ) {
          issue('number', 'Enter the 12-digit Aadhaar number')
        }
      }
      if (meta.hasIssueDate) {
        if (!document.validFrom) issue('validFrom', 'Valid from date is required')
        else if (document.validFrom > todayIso()) issue('validFrom', 'Date cannot be in the future')
      }
      if (meta.hasExpiryDate) {
        if (!document.validTo) issue('validTo', 'Valid to date is required')
        else if (document.validTo < shiftedIso({ days: 1 })) issue('validTo', 'Document must not be expired')
      }
      if (meta.hasPlace && !document.place.trim()) issue('place', 'Place of issue is required')
    })

export type ProofDocument = z.input<ReturnType<typeof createDocumentSchema>>

export const DOCUMENT_DEFAULTS: ProofDocument = {
  docTypeId: '',
  docTypeName: '',
  categories: [],
  number: '',
  validFrom: '',
  validTo: '',
  place: '',
  file: null,
}

/** Documents per holder type. */
export type ProofStageView = Record<string, ProofDocument[]>
