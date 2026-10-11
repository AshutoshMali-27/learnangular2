/** One application in the In-process and MIS lists (`NRIClient` on the backend), in app naming. */
export interface ReportRow {
  formNo: string
  skRefNo: string
  pan: string
  email: string
  mobile: string
  clientName: string
  branchCode: string
  nriType: string
  products: string
  /** `INPROCESS` or the status text. */
  status: string
  /** Title of the stage the form is waiting on; empty once submitted. */
  nextStage: string
}

/** One account in the Account Status search (`SearchData`). */
export interface AccountRow {
  formNo: string
  customerId: string
  loginId: string
  clientName: string
  s2kId: string
  branchName: string
  branchCode: string
  leadId: string
  pan: string
  formStatus: string
  accountStatus: string
  lockRemarks: string
  accountOpenDate: string
  updateDate: string
  nriType: string
  branchId: string
  accountType: string
  products: string
}

export interface AccountFilters {
  customerId: string
  s2kId: string
  dpClientId: string
  formNumber: string
  loginId: string
  mobileNo: string
  panNo: string
  emailId: string
  formStatusId: string
  formRecDateFrom: string
  formRecDateTo: string
  accountOpenedFromDt: string
  accountOpenetToDt: string
  /** Set once Search is pressed; nothing is listed before that. */
  searched: string
}

type Fields = Record<string, string>

/** `AccountStatusReportInDepthReport`: the read-only 360° view of one account. */
export interface AccountDetail {
  ClientData: Fields
  RegisteredAddressDetails: Fields
  CommunicationAddressDetails: Fields
  ClientJurisdictionDetails: Fields
  BankDetails: Fields[]
  FATCADetail: Fields[]
  DocProofDetails: Fields[]
  DPDetail: Fields[]
  NomineeDetail: Fields[]
  'Client Extra Detail': Fields
}
