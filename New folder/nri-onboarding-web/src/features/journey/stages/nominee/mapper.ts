import { isoToDisplay } from '@/lib/dates'
import { isMinor, PROOF_TYPE, RELATION_OTHER, type NomineeAccount } from './rules'
import type { NomineeRecord } from './schema'
import type { GuardianPayload, NomineePayload, NomineeRequest } from './types'

const flag = (value: boolean) => (value ? 'Y' : 'N')
const otherRelation = (relationId: string, text: string) => (relationId === RELATION_OTHER ? text.trim() : '')

const toGuardianPayload = ({ guardian }: NomineeRecord): GuardianPayload => ({
  ProofTypeID: PROOF_TYPE.PAN,
  ProofNumber: guardian.proofNumber.trim().toUpperCase(),
  GuardianProofPath: guardian.proof?.filePath ?? '',
  NamePrefix: guardian.name.prefix,
  FirstName: guardian.name.firstName.trim(),
  MiddleName: guardian.name.middleName.trim(),
  LastName: guardian.name.lastName.trim(),
  DateOfBirth: isoToDisplay(guardian.dob),
  RelationshipID: guardian.relationId,
  RelationshipOther: otherRelation(guardian.relationId, guardian.relationOther),
  AddressLine1: guardian.address.line1.trim(),
  AddressLine2: guardian.address.line2.trim(),
  AddressLine3: guardian.address.line3.trim(),
  CityID: guardian.address.cityId,
  StateID: guardian.address.stateId,
  CountryID: guardian.address.countryId,
  Pincode: guardian.address.pincode,
  TelephoneNumber: guardian.telephone,
  MobileNumber: guardian.mobile,
  EmailID: guardian.email,
})

const toNomineePayload = (nominee: NomineeRecord, account: NomineeAccount, index: number): NomineePayload => {
  const needsGuardian = isMinor(nominee.dob)

  return {
    Segment: '1',
    NomNo: String(index + 1),
    NRIType: account,
    NamePrefix: nominee.name.prefix,
    FirstName: nominee.name.firstName.trim(),
    MiddleName: nominee.name.middleName.trim(),
    LastName: nominee.name.lastName.trim(),
    PanNumber: '',
    AadhaarNumber: '',
    ProofTypeID: nominee.proofTypeId,
    ProofNumber: nominee.proofNumber.trim().toUpperCase(),
    NomineeProofPath: nominee.proof?.filePath ?? '',
    RelationshipID: nominee.relationId,
    RelationshipOther: otherRelation(nominee.relationId, nominee.relationOther),
    DateOfBirth: isoToDisplay(nominee.dob),
    AddressLine1: nominee.address.line1.trim(),
    AddressLine2: nominee.address.line2.trim(),
    AddressLine3: nominee.address.line3.trim(),
    CityID: nominee.address.cityId,
    StateID: nominee.address.stateId,
    CountryID: nominee.address.countryId,
    Pincode: nominee.address.pincode,
    TelephoneNumber: nominee.telephone,
    FaxNumber: '',
    MobileNumber: nominee.mobile,
    EmailID: nominee.email,
    BankAccountNumber: '',
    ProofDetails: '',
    DpID: '',
    DpClientID: '',
    IsGuardianPresent: flag(needsGuardian),
    DeclarationDetail: 'N',
    DeclarationFlag: 'N',
    DeclarationNRE: flag(account === 'NRE'),
    DeclarationNRO: flag(account === 'NRO'),
    ShareOfNominee: nominee.share,
    NOM_RESID_PAYBL: 'N',
    // Guardian details typed for a nominee who turned out to be an adult are not sent.
    GuardianDetails: needsGuardian ? toGuardianPayload(nominee) : null,
  }
}

interface NomineeContext {
  formNo: string
  skRefNo: string
  empId: string
  pan: string
}

/** NRE and NRO nominees travel in one list, told apart by `NRIType`. */
export const toNomineeRequest = (
  nominees: Partial<Record<NomineeAccount, NomineeRecord[]>>,
  context: NomineeContext,
): NomineeRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  NomOpt: 'Y',
  formno: context.formNo,
  panno: context.pan,
  NomineeDetails: (Object.entries(nominees) as [NomineeAccount, NomineeRecord[]][]).flatMap(
    ([account, list]) => list.map((nominee, index) => toNomineePayload(nominee, account, index)),
  ),
})

export const toNoNomineeRequest = (context: Pick<NomineeContext, 'skRefNo' | 'empId'>): NomineeRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  NomOpt: 'N',
  NomineeDetails: [],
})
