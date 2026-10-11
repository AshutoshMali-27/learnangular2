import { isoToDisplay } from '@/lib/dates'
import { CATEGORY, DOC_TYPE, maskAadhaar, MASKED_AADHAAR } from './rules'
import type { ProofDocument } from './schema'
import type { ProofPayload, ProofRequest } from './types'

const flag = (value: boolean) => (value ? 'Y' : 'N')

interface ProofContext {
  formNo: string
  skRefNo: string
  empId: string
  /** The primary applicant's PAN; with the form number it names the document folder. */
  pan: string
}

/** What is kept for a document number: Aadhaar is masked before it is stored anywhere. */
export const storedNumber = (document: ProofDocument) => {
  const number = document.number.trim().toUpperCase()
  if (document.docTypeId !== DOC_TYPE.AADHAAR || MASKED_AADHAAR.test(number)) return number
  return maskAadhaar(number)
}

const toProofPayload = (document: ProofDocument, holderType: string, context: ProofContext): ProofPayload => {
  const has = (category: string) => document.categories.includes(category)
  const currentAddress = has(CATEGORY.CURRENT_ADDRESS)
  const permanentAddress = has(CATEGORY.PERMANENT_ADDRESS)

  return {
    FormEntryID: context.skRefNo,
    EmployeeCode: context.empId,
    HolderType: holderType,
    ProofTypeID: document.docTypeId,
    ProofDocTypeName: document.docTypeName,
    ProofNumber: storedNumber(document),
    DateOfIssue: isoToDisplay(document.validFrom),
    DateOfExpiry: isoToDisplay(document.validTo),
    PlaceOfIssue: document.place.trim(),
    ProofPath: document.file?.filePath ?? '',
    IsIdentityProof: flag(has(CATEGORY.ID)),
    IsAddressProof: flag(currentAddress || permanentAddress),
    IsCorrespondenceAddressProof: flag(currentAddress),
    IsPermanentAddressProof: flag(permanentAddress),
    IsIncomeProof: flag(has(CATEGORY.INCOME)),
    IsSignatureProof: 'N',
    IsDirectorProof: 'N',
    IsIntroducerProof: 'N',
    IsProofVerified: 'N',
    IsNoTradingProof: 'N',
  }
}

/** `documents` is keyed by holder type; every holder's documents go in one request. */
export const toProofRequest = (
  documents: Record<string, ProofDocument[]>,
  context: ProofContext,
): ProofRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  employeeformno: context.formNo,
  employeePanNo: context.pan,
  ProofDetails: Object.entries(documents).flatMap(([holderType, list]) =>
    list.map((document) => toProofPayload(document, holderType, context)),
  ),
})
