import { describe, expect, it } from 'vitest'
import { EMPTY_ADDRESS } from '@/components/shared/address/address.schema'
import type { DocumentTypeMeta } from '@/features/masters'
import { shiftedIso, todayIso } from '@/lib/dates'
import { toFatcaPayload, toFatcaRequest } from './fatca/mapper'
import { occupationBlocks } from './fatca/rules'
import { createFatcaSchema, EMPTY_RESIDENCY, FATCA_DEFAULTS, type FatcaRecord } from './fatca/schema'
import { toHolderRequest } from './holder/mapper'
import { HOLDER_DEFAULTS, holderSchema, type HolderRecord } from './holder/schema'
import { toNomineeRequest, toNoNomineeRequest } from './nominee/mapper'
import { availableAccounts, shareTotal } from './nominee/rules'
import { createNomineeSchema, NOMINEE_DEFAULTS, type NomineeRecord } from './nominee/schema'
import { toProofRequest } from './proof/mapper'
import { allowedCategories, missingDocuments, proofSections } from './proof/rules'
import { createDocumentSchema, DOCUMENT_DEFAULTS, type ProofDocument } from './proof/schema'

const INDIA_ADDRESS = {
  ...EMPTY_ADDRESS,
  line1: '12 MG Road',
  countryId: '2',
  stateId: '201',
  cityId: '20101',
  pincode: '400001',
}
const FILE = { filePath: 'NRI000123_ABCPE1234F/doc.pdf', fileName: 'doc.pdf' }
const paths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((issue) => issue.path.join('.'))

// ---------------------------------------------------------------- Holder

const HOLDER: HolderRecord = {
  ...HOLDER_DEFAULTS,
  pan: 'ABCPH1234K',
  panStatus: 'valid',
  dob: '20/06/1992',
  nameAsPerPan: 'PRIYA RAHUL SHARMA',
  panAadhaarSeeding: 'Y',
  name: { prefix: 'Mrs.', firstName: 'PRIYA', middleName: 'RAHUL', lastName: 'SHARMA' },
  residentialStatus: 'NRI',
  gender: 'F',
  maritalStatus: 'M',
  fatherOrSpouse: 'H',
  fatherSpouseName: { prefix: 'Mr.', firstName: 'Rahul', middleName: '', lastName: 'Sharma' },
  email: 'priya@example.com',
  emailStatus: 'valid',
  emailRelation: '0',
  mobile: '9876500001',
  mobileStatus: 'valid',
  mobileRelation: '0',
  permanent: INDIA_ADDRESS,
  sameAsPermanent: true,
}

describe('holder', () => {
  it('validates a complete holder and requires verified PAN and contacts', () => {
    expect(paths(holderSchema.safeParse(HOLDER))).toEqual([])
    expect(paths(holderSchema.safeParse({ ...HOLDER, panStatus: 'idle', mobileStatus: 'invalid' }))).toEqual(
      expect.arrayContaining(['panStatus', 'mobileStatus']),
    )
  })

  it('builds the SaveHolders request with holder types by position', () => {
    const request = toHolderRequest([HOLDER, { ...HOLDER, pan: 'ABCPJ5678L' }], { skRefNo: '100045', empId: 'E1' })
    expect(request.IsHolderAvailable).toBe('Y')
    expect(request.HolderDetails.map((holder) => holder.HolderType)).toEqual(['2ND', '3RD'])
    expect(request.AddressDetails.map((address) => address.HolderType)).toEqual(['2ND', '3RD'])
    expect(request.HolderDetails[0]).toMatchObject({
      PAN: 'ABCPH1234K',
      NamePrefix: 'Mrs.',
      FatherHusbandFlag: 'H',
      FatherHusbandName: 'Rahul Sharma',
      PrefixMaidenName: '0',
      OccupationTypeID: '0',
      IncomeSlabID: '5',
      SmsTrading: 'Y',
    })
    expect(request.AddressDetails[0].IsSameAddress).toBe('Y')
    expect(request.AddressDetails[0].CorrespondenceAddress.AddressLineOne).toBe('12 MG Road')
  })

  it('builds the Skip Holder request', () => {
    expect(toHolderRequest([], { skRefNo: '100045', empId: 'E1' })).toEqual({
      FormEntryID: '100045',
      EmployeeCode: 'E1',
      IsHolderAvailable: 'N',
      HolderDetails: [],
      AddressDetails: [],
    })
  })
})

// ---------------------------------------------------------------- FATCA

const FATCA: FatcaRecord = {
  ...FATCA_DEFAULTS,
  countryOfBirth: '2',
  placeOfBirth: 'MUMBAI',
  occupation: '40',
  countryOfResidence: '10',
  incomeSlab: '3',
  sourceOfWealth: '01',
  netWorth: '1000000',
  netWorthDate: todayIso(),
  nationality: 'IN',
  citizenship: '2',
  pep: '8',
  usPerson: 'N',
  hasForeignTaxResidency: 'N',
}
const VALID_ROW = { fromDate: '2020-01-01', countryId: '10', tin: 'TIN123', tinStatus: 'valid' as const, proof: FILE }
const primary = createFatcaSchema({ isPrimary: true, nriCategory: 'I' })
const joint = createFatcaSchema({ isPrimary: false, nriCategory: 'I' })

describe('fatca', () => {
  it('accepts a complete declaration', () => {
    expect(paths(primary.safeParse(FATCA))).toEqual([])
  })

  it('asks the primary applicant for occupation details, not joint holders', () => {
    expect(occupationBlocks('25', true)).toEqual({ employer: true, business: true, other: false })
    expect(paths(primary.safeParse({ ...FATCA, occupation: '25' }))).toEqual(
      expect.arrayContaining(['employerName', 'employerCountry', 'employerAddress', 'natureOfBusiness']),
    )
    expect(paths(joint.safeParse({ ...FATCA, occupation: '25' }))).toEqual([])
    expect(paths(primary.safeParse({ ...FATCA, occupation: '31' }))).toEqual(['otherOccupation'])
  })

  it('allows India as residence for the primary applicant only when a Mariner', () => {
    expect(paths(primary.safeParse({ ...FATCA, countryOfResidence: '2' }))).toEqual(['countryOfResidence'])
    const mariner = createFatcaSchema({ isPrimary: true, nriCategory: 'M' })
    expect(paths(mariner.safeParse({ ...FATCA, countryOfResidence: '2' }))).toEqual([])
    expect(paths(joint.safeParse({ ...FATCA, countryOfResidence: '2' }))).toEqual([])
  })

  it('requires the approval document for a PEP primary applicant', () => {
    expect(paths(primary.safeParse({ ...FATCA, pep: '1' }))).toEqual(['pepDocument'])
    expect(paths(primary.safeParse({ ...FATCA, pep: '1', pepDocument: FILE }))).toEqual([])
    expect(paths(joint.safeParse({ ...FATCA, pep: '1' }))).toEqual([])
  })

  it('checks the net worth amount and date', () => {
    expect(paths(primary.safeParse({ ...FATCA, netWorth: '0' }))).toEqual(['netWorth'])
    expect(paths(primary.safeParse({ ...FATCA, netWorth: '10.555' }))).toEqual(['netWorth'])
    expect(paths(primary.safeParse({ ...FATCA, netWorthDate: shiftedIso({ years: -2 }) }))).toEqual(['netWorthDate'])
  })

  it('requires the first tax residency to be validated, and later rows only once started', () => {
    const none = { ...FATCA, hasForeignTaxResidency: 'Y' }
    expect(paths(primary.safeParse(none))).toEqual([
      'residencies.0.countryId',
      'residencies.0.tin',
      'residencies.0.proof',
      'residencies.0.tinStatus',
    ])

    const one = { ...none, residencies: [VALID_ROW, EMPTY_RESIDENCY, EMPTY_RESIDENCY] }
    expect(paths(primary.safeParse(one))).toEqual([])

    const started = { ...none, residencies: [VALID_ROW, { ...EMPTY_RESIDENCY, tin: 'X1' }, EMPTY_RESIDENCY] }
    expect(paths(primary.safeParse(started))).toEqual(
      expect.arrayContaining(['residencies.1.countryId', 'residencies.1.tinStatus']),
    )

    const india = { ...none, residencies: [{ ...VALID_ROW, countryId: '2' }, EMPTY_RESIDENCY, EMPTY_RESIDENCY] }
    expect(paths(primary.safeParse(india))).toEqual(['residencies.0.countryId'])
  })

  it('builds the payload with every backend key and holder types by position', () => {
    const withResidency = {
      ...FATCA,
      hasForeignTaxResidency: 'Y',
      residencies: [VALID_ROW, EMPTY_RESIDENCY, EMPTY_RESIDENCY],
    }
    const payload = toFatcaPayload(withResidency, 0)

    expect(payload).toMatchObject({
      HOLDERTYPE: 'TRD',
      CO_BIR_INC: '2',
      PO_BIR_INC: 'MUMBAI',
      NET_WORTH: '1000000',
      NATIONALITY: 'IN',
      PEP_FLAG: '8',
      US_PERSON_FLG: 'N',
      TAX_RES_OTH_CNTRY_FLG: 'Y',
      TAX_RES1: '10',
      TPIN1: 'TIN123',
      ID1_TYPE: 'T',
      TIN1_PROOF_PATH: FILE.filePath,
      TAX_RES2: '',
      ID2_TYPE: '',
      UBO_NAME: '',
      GIIN_NO: '',
    })
    // The documented model (Docs/API/FatcaController.md §6) has 107 string keys besides FormEntryID.
    expect(Object.keys(payload)).toHaveLength(107)
    expect(Object.values(payload).every((value) => typeof value === 'string')).toBe(true)

    const request = toFatcaRequest([FATCA, FATCA, FATCA], { skRefNo: '100045', empId: 'E1' })
    expect(request.FatcaData.map((record) => record.HOLDERTYPE)).toEqual(['TRD', '2ND', '3RD'])
  })

  it('does not send details of an occupation block that is not shown', () => {
    const payload = toFatcaPayload({ ...FATCA, occupation: '40', employerName: 'Acme', natureOfBusiness: '2' }, 0)
    expect(payload.EMPLOYER_NAME).toBe('')
    expect(payload.NATURE_BUS).toBe('')
  })
})

// ---------------------------------------------------------------- Proof

const meta = (flags: Partial<DocumentTypeMeta>): DocumentTypeMeta => ({
  hasNumber: true,
  hasIssueDate: false,
  hasExpiryDate: false,
  hasPlace: false,
  isIdProof: false,
  isAddressProof: false,
  isBankProof: false,
  ...flags,
})
const META: Record<string, DocumentTypeMeta> = {
  '3': meta({ isIdProof: true }),
  '5': meta({ hasIssueDate: true, hasExpiryDate: true, hasPlace: true, isIdProof: true, isAddressProof: true }),
  '74': meta({ isIdProof: true, isAddressProof: true }),
}
const documentSchema = createDocumentSchema((id) => META[id])
const PAN_DOC: ProofDocument = {
  ...DOCUMENT_DEFAULTS,
  docTypeId: '3',
  docTypeName: 'PAN Card',
  categories: ['id'],
  number: 'ABCPE1234F',
  file: FILE,
}
const PASSPORT_DOC: ProofDocument = {
  ...DOCUMENT_DEFAULTS,
  docTypeId: '5',
  docTypeName: 'Passport',
  categories: ['id', 'permanentAddress'],
  number: 'P1234567',
  validFrom: '2020-01-15',
  validTo: shiftedIso({ years: 3 }),
  place: 'Mumbai',
  file: FILE,
}

describe('proof', () => {
  it('offers categories from the document type flags', () => {
    expect(allowedCategories(META['3']).map((option) => option.value)).toEqual(['id'])
    expect(allowedCategories(META['5']).map((option) => option.value)).toEqual([
      'currentAddress',
      'permanentAddress',
      'id',
    ])
    expect(allowedCategories(meta({ isBankProof: true })).map((option) => option.value)).toEqual(['income'])
  })

  it('requires the fields the document type calls for', () => {
    expect(paths(documentSchema.safeParse(PAN_DOC))).toEqual([])
    expect(paths(documentSchema.safeParse(PASSPORT_DOC))).toEqual([])
    expect(paths(documentSchema.safeParse({ ...PAN_DOC, number: 'ABCDE1234F' }))).toEqual(['number'])
    expect(
      paths(documentSchema.safeParse({ ...PASSPORT_DOC, validFrom: '', validTo: todayIso(), place: '', file: null })),
    ).toEqual(expect.arrayContaining(['validFrom', 'validTo', 'place', 'file']))
    expect(paths(documentSchema.safeParse({ ...PAN_DOC, categories: [] }))).toEqual(['categories'])
  })

  it('knows which mandatory documents each holder still lacks', () => {
    const [client, second] = proofSections(2)
    expect(proofSections(1)).toHaveLength(1)
    expect(missingDocuments(client, [])).toEqual(['PAN', 'Passport'])
    expect(missingDocuments(client, [PAN_DOC])).toEqual(['Passport'])
    expect(missingDocuments(client, [PAN_DOC, PASSPORT_DOC])).toEqual([])
    expect(missingDocuments(second, [PAN_DOC])).toEqual([])
  })

  it('builds the SaveProofDetails request and masks Aadhaar', () => {
    const aadhaar: ProofDocument = {
      ...DOCUMENT_DEFAULTS,
      docTypeId: '74',
      docTypeName: 'Aadhaar Card',
      categories: ['currentAddress'],
      number: '123456789012',
      file: FILE,
    }
    const request = toProofRequest(
      { TRD: [PAN_DOC, PASSPORT_DOC, aadhaar], '2ND': [PAN_DOC] },
      { formNo: 'NRI000123', skRefNo: '100045', empId: 'E1', pan: 'ABCPE1234F' },
    )

    expect(request).toMatchObject({ employeeformno: 'NRI000123', employeePanNo: 'ABCPE1234F' })
    expect(request.ProofDetails.map((proof) => proof.HolderType)).toEqual(['TRD', 'TRD', 'TRD', '2ND'])
    expect(request.ProofDetails[1]).toMatchObject({
      ProofTypeID: '5',
      DateOfIssue: '15/01/2020',
      PlaceOfIssue: 'Mumbai',
      IsIdentityProof: 'Y',
      IsAddressProof: 'Y',
      IsPermanentAddressProof: 'Y',
      IsCorrespondenceAddressProof: 'N',
      IsIncomeProof: 'N',
      ProofPath: FILE.filePath,
    })
    expect(request.ProofDetails[2].ProofNumber).toBe('XXXX-XXXX-9012')
  })
})

// ---------------------------------------------------------------- Nominee

const ADULT: NomineeRecord = {
  ...NOMINEE_DEFAULTS,
  proofTypeId: '3',
  proofNumber: 'AAAPA1111A',
  name: { prefix: 'Mrs.', firstName: 'Priya', middleName: '', lastName: 'Sharma' },
  dob: '1990-08-15',
  share: '100',
  relationId: '1',
  address: INDIA_ADDRESS,
  mobile: '9876500002',
  email: 'priya.n@example.com',
}
const MINOR: NomineeRecord = {
  ...ADULT,
  proofNumber: 'BBBPB2222B',
  name: { prefix: 'Miss', firstName: 'Anya', middleName: '', lastName: 'Sharma' },
  dob: shiftedIso({ years: -10 }),
  share: '40',
  mobile: '9876500003',
  email: 'anya@example.com',
  guardian: {
    ...NOMINEE_DEFAULTS.guardian,
    proofNumber: 'CCCPC3333C',
    name: { prefix: 'Mr.', firstName: 'Vikram', middleName: '', lastName: 'Rao' },
    dob: '1980-01-01',
    relationId: '4',
    address: INDIA_ADDRESS,
    mobile: '9876500004',
    email: 'vikram@example.com',
    proof: FILE,
  },
}
const nomineeSchema = (others: NomineeRecord[] = []) =>
  createNomineeSchema({ clientPan: 'ABCPE1234F', others, othersShare: shareTotal(others) })

describe('nominee', () => {
  it('offers the account types opened in Inward', () => {
    const progress = {
      stageId: 5, pan: '', holderCount: 1, nriCategory: '', email: '', isBankAvailable: '' as const,
      nriTypes: { nrePis: true, nreNonPis: false, nroPis: false, nroNonPis: true },
    }
    expect(availableAccounts(progress)).toEqual(['NRE', 'NRO'])
    expect(availableAccounts({ ...progress, nriTypes: { ...progress.nriTypes, nroNonPis: false } })).toEqual(['NRE'])
  })

  it('accepts an adult nominee without guardian details', () => {
    expect(paths(nomineeSchema().safeParse(ADULT))).toEqual([])
  })

  it('requires a full guardian for a minor', () => {
    expect(paths(nomineeSchema().safeParse(MINOR))).toEqual([])
    expect(paths(nomineeSchema().safeParse({ ...MINOR, guardian: NOMINEE_DEFAULTS.guardian }))).toEqual(
      expect.arrayContaining([
        'guardian.proofNumber',
        'guardian.name.firstName',
        'guardian.dob',
        'guardian.relationId',
        'guardian.address.line1',
        'guardian.mobile',
        'guardian.email',
        'guardian.proof',
      ]),
    )
  })

  it('keeps guardian and nominee, and client and nominee, apart', () => {
    expect(paths(nomineeSchema().safeParse({ ...ADULT, proofNumber: 'ABCPE1234F' }))).toEqual(['proofNumber'])
    const sameContact = { ...MINOR, guardian: { ...MINOR.guardian, mobile: MINOR.mobile, email: MINOR.email } }
    expect(paths(nomineeSchema().safeParse(sameContact))).toEqual(['guardian.mobile', 'guardian.email'])
    const youngGuardian = { ...MINOR, guardian: { ...MINOR.guardian, dob: shiftedIso({ years: -17 }) } }
    expect(paths(nomineeSchema().safeParse(youngGuardian))).toEqual(['guardian.dob'])
  })

  it('caps the account share at 100 and rejects duplicate nominees', () => {
    const first = { ...ADULT, share: '70' }
    expect(paths(nomineeSchema([first]).safeParse(MINOR))).toEqual(['share'])
    expect(paths(nomineeSchema([first]).safeParse({ ...MINOR, share: '30' }))).toEqual([])
    expect(paths(nomineeSchema([first]).safeParse({ ...first, share: '30' }))).toEqual(
      expect.arrayContaining(['proofNumber', 'email', 'mobile', 'name.firstName']),
    )
    expect(paths(nomineeSchema().safeParse({ ...ADULT, share: '0' }))).toEqual(['share'])
  })

  it('validates the proof number by type', () => {
    expect(paths(nomineeSchema().safeParse({ ...ADULT, proofTypeId: '5', proofNumber: 'P1234567' }))).toEqual([])
    expect(paths(nomineeSchema().safeParse({ ...ADULT, proofTypeId: '5', proofNumber: 'Q1234567' }))).toEqual([
      'proofNumber',
    ])
    expect(paths(nomineeSchema().safeParse({ ...ADULT, proofTypeId: '74', proofNumber: '1234' }))).toEqual([
      'proofNumber',
    ])
  })

  it('builds the save request across accounts', () => {
    const request = toNomineeRequest(
      { NRE: [{ ...ADULT, share: '60' }, MINOR], NRO: [ADULT] },
      { formNo: 'NRI000123', skRefNo: '100045', empId: 'E1', pan: 'ABCPE1234F' },
    )

    expect(request).toMatchObject({ NomOpt: 'Y', formno: 'NRI000123', panno: 'ABCPE1234F' })
    expect(request.NomineeDetails.map((n) => [n.NRIType, n.NomNo, n.DeclarationNRE, n.DeclarationNRO])).toEqual([
      ['NRE', '1', 'Y', 'N'],
      ['NRE', '2', 'Y', 'N'],
      ['NRO', '1', 'N', 'Y'],
    ])
    expect(request.NomineeDetails[0]).toMatchObject({
      DateOfBirth: '15/08/1990',
      ShareOfNominee: '60',
      IsGuardianPresent: 'N',
      GuardianDetails: null,
      AddressLine1: '12 MG Road',
    })
    expect(request.NomineeDetails[1].IsGuardianPresent).toBe('Y')
    expect(request.NomineeDetails[1].GuardianDetails).toMatchObject({
      ProofTypeID: '3',
      ProofNumber: 'CCCPC3333C',
      DateOfBirth: '01/01/1980',
      GuardianProofPath: FILE.filePath,
    })
  })

  it('builds the opt-out request', () => {
    expect(toNoNomineeRequest({ skRefNo: '100045', empId: 'E1' })).toEqual({
      FormEntryID: '100045',
      EmployeeCode: 'E1',
      NomOpt: 'N',
      NomineeDetails: [],
    })
  })
})
