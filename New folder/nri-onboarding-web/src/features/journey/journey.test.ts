import { describe, expect, it } from 'vitest'
import { EMPTY_ADDRESS } from '@/components/shared/address/address.schema'
import { currentStagePath, getCurrentStage, getStageStatus, STAGES } from './stages.config'
import { toAddressRequest, fromAddressRequest } from './stages/address/mapper'
import { addressStageSchema } from './stages/address/schema'
import { fromInwardPayload, toInwardPayload } from './stages/inward/mapper'
import { ageFromDob, deriveProducts, prefixDefaults } from './stages/inward/rules'
import { INWARD_DEFAULTS, inwardSchema, type InwardValues } from './stages/inward/schema'
import type { JourneyProgress } from './types'

const progress = (overrides: Partial<JourneyProgress> = {}): JourneyProgress => ({
  stageId: 0,
  pan: '',
  holderCount: 1,
  nriCategory: '',
  email: '',
  isBankAvailable: '',
  nriTypes: { nrePis: false, nreNonPis: false, nroPis: false, nroNonPis: false },
  ...overrides,
})

const stage = (key: string) => STAGES.find((item) => item.key === key)!

describe('stage registry', () => {
  it('starts a fresh form at Inward', () => {
    expect(getCurrentStage(progress())?.key).toBe('inward')
    expect(getStageStatus(stage('address'), progress())).toBe('pending')
  })

  it('skips the disabled Family stage (8) after Miscellaneous (7)', () => {
    expect(getCurrentStage(progress({ stageId: 7 }))?.key).toBe('extra-details')
  })

  it('offers Bank Details only when a bank account is available', () => {
    expect(getCurrentStage(progress({ stageId: 10, isBankAvailable: 'Y' }))?.key).toBe('bank-details')
    expect(getCurrentStage(progress({ stageId: 10, isBankAvailable: 'N' }))).toBeNull()
    expect(getStageStatus(stage('bank-details'), progress({ stageId: 10, isBankAvailable: 'N' }))).toBe('skipped')
    expect(currentStagePath('NRI000123', progress({ stageId: 10, isBankAvailable: 'N' }))).toBe(
      '/journey/NRI000123/complete',
    )
  })

  it('marks earlier stages completed and the next one current', () => {
    const atAddress = progress({ stageId: 1 })
    expect(getStageStatus(stage('inward'), atAddress)).toBe('completed')
    expect(getStageStatus(stage('address'), atAddress)).toBe('current')
    expect(getStageStatus(stage('holder'), atAddress)).toBe('pending')
  })
})

describe('inward rules', () => {
  it('derives products from NRI types', () => {
    expect(deriveProducts(['NRE_PIS'], false)).toEqual({ equity: true, mutualFunds: false, fno: false })
    expect(deriveProducts(['NRO_NONPIS'], true)).toEqual({ equity: false, mutualFunds: true, fno: true })
    // FNO cannot be kept without NRO NONPIS.
    expect(deriveProducts(['NRE_NONPIS'], true).fno).toBe(false)
  })

  it('applies title defaults', () => {
    expect(prefixDefaults('Mr.')).toEqual({ gender: 'M', fatherOrSpouse: 'F' })
    expect(prefixDefaults('Mrs.')).toEqual({ gender: 'F', maritalStatus: 'M', fatherOrSpouse: 'H' })
    expect(prefixDefaults('Dr.')).toEqual({})
  })

  it('computes age from a dd/MM/yyyy date', () => {
    const today = new Date(2026, 9, 9)
    expect(ageFromDob('09/10/2008', today)).toBe(18)
    expect(ageFromDob('10/10/2008', today)).toBe(17)
  })
})

const VALID_INWARD: InwardValues = {
  ...INWARD_DEFAULTS,
  pan: 'ABCPE1234F',
  panStatus: 'valid',
  dob: '15/01/1990',
  nameAsPerPan: 'RAHUL KUMAR SHARMA',
  panAadhaarSeeding: 'Y',
  name: { prefix: 'Mr.', firstName: 'RAHUL', middleName: 'KUMAR', lastName: 'SHARMA' },
  nriWith: 'I',
  residentialStatus: 'NRI',
  gender: 'M',
  maritalStatus: 'U',
  fatherOrSpouse: 'F',
  fatherSpouseName: { firstName: 'Suresh', middleName: '', lastName: 'Sharma' },
  nriTypes: ['NRE_PIS', 'NRO_NONPIS'],
  fno: true,
  contractNote: 'DIG',
  email: 'rahul@example.com',
  emailStatus: 'valid',
  emailRelation: '0',
  mobile: '9876543210',
  mobileStatus: 'valid',
  mobileRelation: '0',
  admin: '9001',
  salesCode: 'SE123',
  salesStatus: 'valid',
}

const errorPaths = (values: InwardValues) => {
  const result = inwardSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('inward schema', () => {
  it('accepts a complete form', () => {
    expect(errorPaths(VALID_INWARD)).toEqual([])
  })

  it('requires the PAN, email, mobile and sales code to be verified', () => {
    const paths = errorPaths({
      ...VALID_INWARD,
      panStatus: 'idle',
      emailStatus: 'invalid',
      mobileStatus: 'idle',
      salesStatus: 'idle',
    })
    expect(paths).toEqual(expect.arrayContaining(['panStatus', 'emailStatus', 'mobileStatus', 'salesStatus']))
  })

  it('requires DP details for each selected side when linking an existing DP', () => {
    const paths = errorPaths({ ...VALID_INWARD, linkExistingDp: 'Y' })
    expect(paths).toEqual(expect.arrayContaining(['nreDp.dpId', 'nreDp.clientId', 'nroDp.dpId', 'nroDp.clientId']))
    expect(
      errorPaths({
        ...VALID_INWARD,
        nriTypes: ['NRE_PIS'],
        linkExistingDp: 'Y',
        nreDp: { dpId: 'IN300214', clientId: '12345678' },
      }),
    ).toEqual([])
  })

  it('reports DP errors even while later steps are still empty', () => {
    // Next on the DP step must catch this before the contact and branch steps are filled.
    const paths = errorPaths({ ...INWARD_DEFAULTS, nriTypes: ['NRE_PIS'], linkExistingDp: 'Y' })
    expect(paths).toContain('nreDp.clientId')
  })

  it('allows Resident Individual only for Mariner', () => {
    expect(errorPaths({ ...VALID_INWARD, residentialStatus: 'RI' })).toContain('residentialStatus')
    expect(errorPaths({ ...VALID_INWARD, residentialStatus: 'RI', nriWith: 'M' })).toEqual([])
  })

  it('requires an entered lead ID to be validated', () => {
    expect(errorPaths({ ...VALID_INWARD, leadId: '12345' })).toContain('leadStatus')
    expect(errorPaths({ ...VALID_INWARD, leadId: '12345', leadStatus: 'valid' })).toEqual([])
  })
})

describe('inward mapper', () => {
  const context = { formNo: 'NRI000123', empId: 'E123', branchId: 'B9' }
  const payload = toInwardPayload(VALID_INWARD, context)

  it('builds the FormInward payload the backend expects', () => {
    expect(payload).toMatchObject({
      formNo: 'NRI000123',
      panNo: 'ABCPE1234F',
      dob: '15/01/1990',
      prefix: 'Mr.',
      Fname: 'RAHUL',
      Mname: 'KUMAR',
      Lname: 'SHARMA',
      isFatherOrHusband: 'F',
      fatherHusbandName: 'Suresh Sharma',
      residentalStatus: 'NRI',
      nriCategory: 'I',
      eqFlag: 'Y',
      mfFlag: 'Y',
      fnoFlag: 'Y',
      nrePis: 'Y',
      nreNonPis: 'N',
      nroPis: 'N',
      nroNonPis: 'Y',
      isExistingDp: 'N',
      NreDPId: 'IN300513',
      NreBeneficiaryId: '',
      NroDPId: 'IN300513',
      billSchId: '5',
      branchCode: 'B9',
      entryBy: 'E123',
      updateBy: 'E123',
      hniFlag: 'N',
      panlink_aadhar: 'Y',
    })
  })

  it('sends exactly the keys of the documented payload', () => {
    // Key list of the sample in Docs/UI/01-Inward.md §8.
    const documented = [
      'formNo', 'panNo', 'dob', 'prefix', 'Fname', 'Mname', 'Lname', 'nameAsPerPan', 'gender',
      'maritalStatus', 'isFatherOrHusband', 'fatherHusbandName', 'fatherHusbandFname',
      'fatherHusbandMname', 'fatherHusbandLname', 'residentalStatus', 'nriCategory', 'eqFlag',
      'mfFlag', 'fnoFlag', 'currFlag', 'comFlag', 'nrePis', 'nreNonPis', 'nroPis', 'nroNonPis',
      'poa', 'billSchId', 'accountType', 'contractNote', 'accountWith', 'isExistingDp',
      'dpNreName', 'NreDPId', 'NreBeneficiaryId', 'dpNroName', 'NroDPId', 'NroBeneficiaryId',
      'emailId', 'emailRel', 'mobileNo', 'mobileRel', 'telephoneNo', 'telephoneNoISD',
      'branchCode', 'servingBranchCode', 'preferredBranchCode', 'adminName', 'leadId',
      'salesExcode', 'remiserCode', 'referingEmployeeCode', 'hniFlag', 'entryBy', 'updateBy',
      'loginId', 'enableACH', 'panlink_aadhar', 'scancopy1',
    ]
    expect(Object.keys(payload).sort()).toEqual(documented.sort())
  })

  it('leaves the unselected DP side empty', () => {
    const nreOnly = toInwardPayload({ ...VALID_INWARD, nriTypes: ['NRE_PIS'] }, context)
    expect(nreOnly.NroDPId).toBe('')
  })

  it('round-trips through the saved payload', () => {
    expect(fromInwardPayload(payload)).toEqual(VALID_INWARD)
  })
})

describe('address stage', () => {
  const permanent = {
    ...EMPTY_ADDRESS,
    line1: '12 MG Road',
    countryId: '2',
    stateId: '201',
    cityId: '20101',
    pincode: '400001',
  }

  it('skips the correspondence block when it is the same as permanent', () => {
    const same = { permanent, sameAsPermanent: true, correspondence: EMPTY_ADDRESS }
    expect(addressStageSchema.safeParse(same).success).toBe(true)
    expect(addressStageSchema.safeParse({ ...same, sameAsPermanent: false }).success).toBe(false)
  })

  it('builds the SaveAddress request and reads it back', () => {
    const values = { permanent, sameAsPermanent: true, correspondence: EMPTY_ADDRESS }
    const request = toAddressRequest(values, { skRefNo: '100045', empId: 'E123' })

    expect(request).toEqual({
      FormEntryID: '100045',
      EmployeeCode: 'E123',
      AddressDetails: [
        {
          HolderType: 'TRD',
          IsSameAddress: 'Y',
          PermanentAddress: {
            AddressLineOne: '12 MG Road', AddressLineTwo: '', AddressLineThree: '', AddressLineFour: '',
            Landmark: '', CityID: '20101', StateID: '201', District: '', CountryID: '2', Pincode: '400001',
          },
          CorrespondenceAddress: {
            AddressLineOne: '12 MG Road', AddressLineTwo: '', AddressLineThree: '', AddressLineFour: '',
            Landmark: '', CityID: '20101', StateID: '201', District: '', CountryID: '2', Pincode: '400001',
          },
        },
      ],
    })
    expect(fromAddressRequest(request)).toEqual({ permanent, sameAsPermanent: true, correspondence: permanent })
  })
})
