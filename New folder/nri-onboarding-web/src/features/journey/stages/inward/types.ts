/**
 * `FormInward` as posted to `NRIAccountOpening/SaveFormDetails` and returned by
 * `GetFormDetails`. Keys keep the backend's spelling (Docs/UI/01-Inward.md §8).
 */
export interface FormInwardPayload {
  formNo: string
  panNo: string
  dob: string
  prefix: string
  Fname: string
  Mname: string
  Lname: string
  nameAsPerPan: string
  gender: string
  maritalStatus: string
  isFatherOrHusband: string
  fatherHusbandName: string
  fatherHusbandFname: string
  fatherHusbandMname: string
  fatherHusbandLname: string
  residentalStatus: string
  nriCategory: string
  eqFlag: string
  mfFlag: string
  fnoFlag: string
  currFlag: string
  comFlag: string
  nrePis: string
  nreNonPis: string
  nroPis: string
  nroNonPis: string
  poa: string
  billSchId: string
  accountType: string
  contractNote: string
  accountWith: string
  isExistingDp: string
  dpNreName: string
  NreDPId: string
  NreBeneficiaryId: string
  dpNroName: string
  NroDPId: string
  NroBeneficiaryId: string
  emailId: string
  emailRel: string
  mobileNo: string
  mobileRel: string
  telephoneNo: string
  telephoneNoISD: string
  branchCode: string
  servingBranchCode: string
  preferredBranchCode: string
  adminName: string
  leadId: string
  salesExcode: string
  remiserCode: string
  referingEmployeeCode: string
  hniFlag: string
  entryBy: string
  updateBy: string
  loginId: string
  enableACH: string
  panlink_aadhar: string
  scancopy1: string
}

export interface SaveInwardResult {
  skReferenceNo: string
}
