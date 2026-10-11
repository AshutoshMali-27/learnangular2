import type { Option } from '@/components/form'
import type { DocumentTypeMeta } from '@/features/masters'

// Business rules of the Proof stage (Docs/UI/05-Proof.md §3–5).

export const DOC_TYPE = { PAN: '3', PASSPORT: '5', AADHAAR: '74' } as const

export const CATEGORY = {
  ID: 'id',
  CURRENT_ADDRESS: 'currentAddress',
  PERMANENT_ADDRESS: 'permanentAddress',
  INCOME: 'income',
} as const

const CATEGORY_LABELS: Record<string, string> = {
  [CATEGORY.ID]: 'ID proof',
  [CATEGORY.CURRENT_ADDRESS]: 'Current address proof',
  [CATEGORY.PERMANENT_ADDRESS]: 'Permanent address proof',
  [CATEGORY.INCOME]: 'Income proof',
}

export const categoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category

/** The proof categories a document type can be used for, from its master flags. */
export function allowedCategories(meta: DocumentTypeMeta | undefined): Option[] {
  if (!meta) return []
  const categories = [
    ...(meta.isAddressProof ? [CATEGORY.CURRENT_ADDRESS, CATEGORY.PERMANENT_ADDRESS] : []),
    ...(meta.isIdProof ? [CATEGORY.ID] : []),
    ...(meta.isBankProof ? [CATEGORY.INCOME] : []),
  ]
  return categories.map((value) => ({ value, label: categoryLabel(value) }))
}

export interface ProofSection {
  /** Holder type sent to the backend, also the list key. */
  holderType: 'TRD' | '2ND' | '3RD'
  title: string
  /** Document types this holder must provide. */
  requiredTypes: { id: string; label: string }[]
}

const PAN = { id: DOC_TYPE.PAN, label: 'PAN' }
const PASSPORT = { id: DOC_TYPE.PASSPORT, label: 'Passport' }

const SECTIONS: ProofSection[] = [
  { holderType: 'TRD', title: 'Client Proof', requiredTypes: [PAN, PASSPORT] },
  { holderType: '2ND', title: 'Holder 2 Proof', requiredTypes: [PAN] },
  { holderType: '3RD', title: 'Holder 3 Proof', requiredTypes: [PAN] },
]

/** One section per holder on the form. */
export const proofSections = (holderCount: number) => SECTIONS.slice(0, Math.max(1, holderCount))

/** Labels of the mandatory documents a section still lacks. Empty means the section is complete. */
export const missingDocuments = (section: ProofSection, documents: { docTypeId: string }[]) =>
  section.requiredTypes
    .filter((type) => !documents.some((document) => document.docTypeId === type.id))
    .map((type) => type.label)

/** Only the last four digits of an Aadhaar number are ever kept. */
export const maskAadhaar = (value: string) => `XXXX-XXXX-${value.replace(/\D/g, '').slice(-4)}`
export const MASKED_AADHAAR = /^XXXX-XXXX-\d{4}$/
