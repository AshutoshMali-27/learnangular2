import type { StandardFilters } from '@/components/shared/StandardFilterFields'
import { operationsMock } from '@/mocks/operations.mock'

/** One form awaiting a PDF (`GetFormDetailsForPDFUpload`), in app naming. */
export interface PdfForm {
  formNo: string
  skRefNo: string
  pan: string
  clientName: string
  email: string
  mobile: string
  /** `Signed KYC PDF` or `PDF With Bank Details`. */
  pdfType: string
  /** Time left before the PDF can be resent; empty when none. */
  cooldown: string
  objections: string[]
  remarks: string
}

export const PDF_QUERY_KEYS = {
  ALL: ['pdf-upload'],
  LIST: (filters: StandardFilters) => ['pdf-upload', 'list', filters],
} as const

const SIGNED_KYC = 'Signed KYC PDF'
const PDF_MIME = 'application/pdf'

// Row rules as pure functions (Docs/UI/18-PdfUpload.md).
export const hasObjection = (form: PdfForm) => form.objections.length > 0
export const hasCooldown = (form: PdfForm) => Boolean(form.cooldown) && form.cooldown !== '0'
/** The generated PDF can be resent only for an objected signed-KYC PDF whose cooldown has run out. */
export const canResend = (form: PdfForm) => form.pdfType === SIGNED_KYC && hasObjection(form) && !hasCooldown(form)
/** Which upload action a file goes to. */
export const uploadTarget = (form: PdfForm) => (form.pdfType === SIGNED_KYC ? 'signed' : 'withBank')
export const isPdf = (file: File) => file.type === PDF_MIME || file.name.toLowerCase().endsWith('.pdf')

// UI phase: resolves from the mock. Endpoints for API integration are named per function.
export const pdfService = {
  /** NRIAccountOpening/GetFormDetailsForPDFUpload. */
  getForms: (filters: StandardFilters): Promise<PdfForm[]> => operationsMock.getPdfForms(filters),

  /**
   * NRIAccountOpening/UploadSignedPDF, or UploadPDFWithBankDetails when `uploadTarget` says so.
   * Multipart: `file`, `formNumber`, `panNo`, `skReferenceNo`.
   */
  upload: (form: PdfForm, _file: File, onProgress: (percent: number) => void): Promise<unknown> =>
    operationsMock.uploadPdf(form.formNo, onProgress),

  /** NRIAccountOpening/ResendPDF `{ FormEntryID }`. */
  resend: (form: PdfForm): Promise<unknown> => operationsMock.resendPdf(form.formNo),
}
