/** One linked bank account in the backend's key names (Docs/UI/11-BankDetails.md §6). */
export interface BankAccountPayload {
  NriType: string
  BankBranchID: string
  IfscCode: string
  AccountNumber: string
  AccountType: string
  IsDefault: '1' | '0'
  RBIReferenceNumber: string
  RBIApprovalDate: string
  ChequeLeafUploadFlag: 'Y' | 'N'
  ChequeLeafUploadPath: string
  MicrCode: string
  TransactionReferenceNumber: string
  UpiID: string
}

/** Body of `BankDetail/SavebankDetails`, posted as indexed form keys. */
export interface BankRequest {
  EmployeeCode: string
  employeeformno: string
  FormEntryID: string
  employeePanNo: string
  BankDetails: BankAccountPayload[]
}
