/** Guardian of a minor nominee, in the backend's key names (Docs/UI/06-Nominee.md §3). */
export interface GuardianPayload {
  ProofTypeID: string
  ProofNumber: string
  GuardianProofPath: string
  NamePrefix: string
  FirstName: string
  MiddleName: string
  LastName: string
  DateOfBirth: string
  RelationshipID: string
  RelationshipOther: string
  AddressLine1: string
  AddressLine2: string
  AddressLine3: string
  CityID: string
  StateID: string
  CountryID: string
  Pincode: string
  TelephoneNumber: string
  MobileNumber: string
  EmailID: string
}

/** One nominee (Docs/UI/06-Nominee.md §5). */
export interface NomineePayload {
  Segment: string
  NomNo: string
  NRIType: string
  NamePrefix: string
  FirstName: string
  MiddleName: string
  LastName: string
  PanNumber: string
  AadhaarNumber: string
  ProofTypeID: string
  ProofNumber: string
  NomineeProofPath: string
  RelationshipID: string
  RelationshipOther: string
  DateOfBirth: string
  AddressLine1: string
  AddressLine2: string
  AddressLine3: string
  CityID: string
  StateID: string
  CountryID: string
  Pincode: string
  TelephoneNumber: string
  FaxNumber: string
  MobileNumber: string
  EmailID: string
  BankAccountNumber: string
  ProofDetails: string
  DpID: string
  DpClientID: string
  IsGuardianPresent: string
  DeclarationDetail: string
  DeclarationFlag: string
  DeclarationNRE: string
  DeclarationNRO: string
  ShareOfNominee: string
  NOM_RESID_PAYBL: string
  /** Null for an adult nominee; the server discards it anyway unless IsGuardianPresent is Y. */
  GuardianDetails: GuardianPayload | null
}

/** Body of `Nominee/SavenomineeData` (opt in) and `SavenomineeDataforNoNominee` (opt out). */
export interface NomineeRequest {
  FormEntryID: string
  EmployeeCode: string
  NomOpt: 'Y' | 'N'
  formno?: string
  panno?: string
  NomineeDetails: NomineePayload[]
}
