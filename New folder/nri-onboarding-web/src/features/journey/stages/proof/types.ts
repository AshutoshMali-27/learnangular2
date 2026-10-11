/** One document in the backend's key names (Docs/UI/05-Proof.md §7). */
export interface ProofPayload {
  FormEntryID: string
  EmployeeCode: string
  HolderType: string
  ProofTypeID: string
  ProofDocTypeName: string
  ProofNumber: string
  DateOfIssue: string
  DateOfExpiry: string
  PlaceOfIssue: string
  ProofPath: string
  IsIdentityProof: string
  IsAddressProof: string
  IsCorrespondenceAddressProof: string
  IsPermanentAddressProof: string
  IsIncomeProof: string
  IsSignatureProof: string
  IsDirectorProof: string
  IsIntroducerProof: string
  IsProofVerified: string
  IsNoTradingProof: string
}

/** Body of `Proof/SaveProofDetails`. */
export interface ProofRequest {
  FormEntryID: string
  EmployeeCode: string
  employeeformno: string
  employeePanNo: string
  ProofDetails: ProofPayload[]
}
