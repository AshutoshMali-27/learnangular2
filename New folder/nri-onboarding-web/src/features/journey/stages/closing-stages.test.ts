import { describe, expect, it } from 'vitest'
import { todayIso } from '@/lib/dates'
import { toBankRequest } from './bank/mapper'
import { BANK_TYPES, enabledBankTypes } from './bank/rules'
import { bankDefaults, createBankSchema, type BankValues } from './bank/schema'
import { toBrokerageRequest } from './brokerage/BrokerageStage'
import { toExtraDetailsRequest } from './extra-details/mapper'
import {
  EXTRA_DETAILS_DEFAULTS,
  extraDetailsSchema,
  type ExtraDetailsValues,
  type StaffVerification,
} from './extra-details/schema'
import { toMiscRequest } from './miscellaneous/mapper'
import { CONSENTS, MISC_DEFAULTS, miscSchema } from './miscellaneous/schema'

const FILE = { filePath: 'NRI000123_ABCPE1234F/file.jpg', fileName: 'file.jpg' }
const paths = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((issue) => issue.path.join('.'))
const context = { formNo: 'NRI000123', skRefNo: '100045', empId: 'E1', branchId: 'B9', pan: 'ABCPE1234F' }

// ---------------------------------------------------------------- Miscellaneous

const allAnswered = (answer: string) => Object.fromEntries(CONSENTS.map(({ name }) => [name, answer]))

describe('miscellaneous', () => {
  it('requires every declaration to be answered', () => {
    expect(paths(miscSchema.safeParse(MISC_DEFAULTS))).toHaveLength(CONSENTS.length)
    expect(paths(miscSchema.safeParse({ answers: allAnswered('N'), authorizedPersonName: '' }))).toEqual([])
  })

  it('requires the authorised person only when dealing through one', () => {
    const yes = { answers: allAnswered('Y'), authorizedPersonName: '' }
    expect(paths(miscSchema.safeParse(yes))).toEqual(['authorizedPersonName'])
    expect(paths(miscSchema.safeParse({ ...yes, authorizedPersonName: 'Ravi Kumar' }))).toEqual([])
  })

  it('builds the documented request', () => {
    const answers = { ...allAnswered('N'), autoCredit: 'Y', smsFromDp: 'Y' }
    expect(toMiscRequest({ answers, authorizedPersonName: 'Ignored' }, context)).toEqual({
      FormEntryID: '100045',
      EmployeeCode: 'E1',
      MiscDetails: {
        IsAMCApplicable: '', AMCTypeID: '0', AMCBankID: '0', AMCAmount: '0', AMCNumber: '0', AMCDate: '',
        IsInNegativeList: 'N', IsDisputeWithOtherMember: '', IsDefaulterSuspendedBySEBI: '', ACHFlag: '',
        IsKRACompliant: '',
      },
      ConsentDetails: {
        ConsentForAutoCredit: 'Y', ConsentForStandingPOA: 'N',
        ConsentToSendHoldingStatementOnAuthorizedEmail: 'N', ConsentToShareEmailRTA: 'N',
        ConsentForInternetTrading: 'N', ConsentForExchangeMarginTrading: 'N', ConsentToRecieveAnnualReport: 'N',
        ConsentForOtherBrokerDealing: 'N', ConsentForOtherBrokerRegNo: 'N', OtherBrokerTelephoneNumber: 'N',
        OtherBrokerFaxNumber: 'N', OtherBrokerWebsiteURL: 'N', ConsentToPledgeAcceptance: 'N',
        // Not sent because dealing through an authorised person was declined.
        AuthorizedPersonName: '', AuthorizedPersonAddress: '', NomineeDeclarationFlag: 'N',
        ConsentForSMSFromDP: 'Y',
      },
    })
  })
})

// ---------------------------------------------------------------- Extra Details

const STAFF: StaffVerification = {
  staffCode: 'E1001',
  name: 'Sunita Verma',
  designation: 'Branch Manager',
  date: '2026-06-01',
  signature: FILE,
}
const EXTRA: ExtraDetailsValues = { ...EXTRA_DETAILS_DEFAULTS, isBankAvailable: 'Y', osv: STAFF, ipv: STAFF }

describe('extra details', () => {
  it('requires the bank answer and the OSV and IPV blocks, but not the interview', () => {
    expect(paths(extraDetailsSchema.safeParse(EXTRA))).toEqual([])
    expect(paths(extraDetailsSchema.safeParse(EXTRA_DETAILS_DEFAULTS))).toEqual(
      expect.arrayContaining(['isBankAvailable', 'osv.staffCode', 'osv.signature', 'ipv.name', 'ipv.date']),
    )
    expect(paths(extraDetailsSchema.safeParse(EXTRA_DETAILS_DEFAULTS)).some((path) => path.startsWith('interview'))).toBe(
      false,
    )
  })

  it('requires years of experience once prior experience is declared', () => {
    expect(paths(extraDetailsSchema.safeParse({ ...EXTRA, hasPriorExperience: true }))).toEqual(['experienceYears'])
    expect(paths(extraDetailsSchema.safeParse({ ...EXTRA, hasPriorExperience: true, experienceYears: 3 }))).toEqual([])
  })

  it('rejects a future verification date', () => {
    expect(paths(extraDetailsSchema.safeParse({ ...EXTRA, osv: { ...STAFF, date: '2999-01-01' } }))).toEqual(['osv.date'])
  })

  it('builds the documented request', () => {
    const request = toExtraDetailsRequest(
      { ...EXTRA, accessInsiderInfo: '1', hasPriorExperience: true, experienceYears: 5, derivativesYears: 2 },
      context,
    )
    expect(request).toMatchObject({ FormEntryID: '100045', EmployeeCode: 'E1', panno: 'ABCPE1234F', formno: 'NRI000123' })
    expect(request.OtherDetails).toEqual({
      is_bank_available: 'Y',
      osv_staff_code: 'E1001', osv_name: 'Sunita Verma', osv_desg: 'Branch Manager', osv_date: '01/06/2026',
      osv_sign_path: FILE.filePath,
      interviewd_staff_code: '', interviewer_name: '', interviewer_desg: '', interviewed_date: '',
      interviewer_sign_path: '',
      tipvempcode: 'E1001', ipv_name: 'Sunita Verma', ipv_desg: 'Branch Manager', dipvverificationdt: '01/06/2026',
      ipv_sign_path: FILE.filePath,
      lipvbranchid: 'B9', tipvverplace: '',
      country_of_res: '0', country_of_res_oth: '', country_src_income: '0', country_src_income_oth: '',
      invstmnt_thrgh_shrkhn: '', nature_of_bus_desc: '', kmp_desg_id: '0', kmp_desg_desc: '',
      access_insider_info: '1', access_insider_info_rmrks: '', usg_sensitv_prdcts_servcs: 'N',
      former_aliasesname: '', citizenship: '0', factiva_upload_path: '',
      is_prior_investment_expirience: 'Y', investment_expirience_yrs: '5',
      expirience_in_derivatives_yrs: '2', other_investment_fields_expirience_yrs: '0',
    })
  })

  it('drops experience years when prior experience is not declared', () => {
    const request = toExtraDetailsRequest({ ...EXTRA, experienceYears: 7 }, context)
    expect(request.OtherDetails.investment_expirience_yrs).toBe('0')
  })
})

// ---------------------------------------------------------------- Brokerage

describe('brokerage', () => {
  it('builds the save request', () => {
    expect(toBrokerageRequest({ schemeId: '2' }, context)).toEqual({
      FormEntryID: '100045',
      EmployeeCode: 'E1',
      BrokerageID: '2',
    })
  })
})

// ---------------------------------------------------------------- Bank

const progress = (nriTypes: Partial<Record<'nrePis' | 'nreNonPis' | 'nroPis' | 'nroNonPis', boolean>>) => ({
  stageId: 10, pan: 'ABCPE1234F', holderCount: 1, nriCategory: 'I', email: '', isBankAvailable: 'Y' as const,
  nriTypes: { nrePis: false, nreNonPis: false, nroPis: false, nroNonPis: false, ...nriTypes },
})
const TYPES = enabledBankTypes(progress({ nrePis: true, nroNonPis: true }))
const validAccount = (accountNo: string, isDefault: boolean) => ({
  ifsc: 'HDFC0000001', branchId: '3456', bankName: 'HDFC Bank', branchName: 'Fort, Mumbai',
  accountNo, accountType: '0', rbiRefNo: 'RBI/2026/1', rbiRefDate: todayIso(), isDefault, status: 'valid' as const,
})
const BANK: BankValues = {
  bankLetter: FILE,
  accounts: {
    NREPIS: validAccount('000111222333', true),
    NRENPIS: validAccount('000111222444', false),
    NRONONPIS: { ...validAccount('000111222555', true), rbiRefNo: '', rbiRefDate: '' },
  },
}
const bankSchema = createBankSchema(TYPES)

describe('bank details', () => {
  it('asks only for the account types opened in Inward', () => {
    expect(TYPES.map((type) => type.title)).toEqual(['NRE PIS', 'NRO NON-PIS'])
    expect(Object.keys(bankDefaults(TYPES).accounts)).toEqual(['NREPIS', 'NRENPIS', 'NRONONPIS'])
    expect(enabledBankTypes(progress({}))).toEqual([])
    expect(BANK_TYPES).toHaveLength(4)
  })

  it('accepts validated accounts and requires the bank letter', () => {
    expect(paths(bankSchema.safeParse(BANK))).toEqual([])
    expect(paths(bankSchema.safeParse({ ...BANK, bankLetter: null }))).toEqual(['bankLetter'])
  })

  it('requires branch, account, RBI details for PIS, and a passed bank check', () => {
    const errors = paths(bankSchema.safeParse(bankDefaults(TYPES)))
    expect(errors).toEqual(
      expect.arrayContaining([
        'bankLetter',
        'accounts.NREPIS.ifsc', 'accounts.NREPIS.accountNo', 'accounts.NREPIS.rbiRefNo',
        'accounts.NREPIS.rbiRefDate', 'accounts.NREPIS.status',
        'accounts.NRONONPIS.ifsc', 'accounts.NRONONPIS.status',
      ]),
    )
    // NON-PIS accounts do not need the RBI reference.
    expect(errors).not.toContain('accounts.NRONONPIS.rbiRefNo')
  })

  it('rejects the same account as both PIS accounts', () => {
    const same = { ...BANK, accounts: { ...BANK.accounts, NRENPIS: validAccount('000111222333', false) } }
    expect(paths(bankSchema.safeParse(same))).toEqual(['accounts.NRENPIS.accountNo'])
  })

  it('builds the indexed save request with one bank letter on every account', () => {
    const request = toBankRequest(BANK, TYPES, context)
    expect(request).toMatchObject({
      EmployeeCode: 'E1', employeeformno: 'NRI000123', FormEntryID: '100045', employeePanNo: 'ABCPE1234F',
    })
    expect(request.BankDetails.map((account) => [account.NriType, account.IsDefault])).toEqual([
      ['NREPIS', '1'],
      ['NRENPIS', '0'],
      ['NRONONPIS', '1'],
    ])
    expect(request.BankDetails[0]).toEqual({
      NriType: 'NREPIS', BankBranchID: '3456', IfscCode: 'HDFC0000001', AccountNumber: '000111222333',
      AccountType: '0', IsDefault: '1', RBIReferenceNumber: 'RBI/2026/1', RBIApprovalDate: todayIso(),
      ChequeLeafUploadFlag: 'Y', ChequeLeafUploadPath: FILE.filePath,
      MicrCode: '', TransactionReferenceNumber: '', UpiID: '',
    })
    expect(request.BankDetails[2]).toMatchObject({ RBIReferenceNumber: '', RBIApprovalDate: '' })
  })
})
