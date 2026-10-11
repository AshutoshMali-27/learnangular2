import { ApiError } from '@/api'
import { listMockForms, TEST_FORM_NOS } from '@/features/journey/journey.mock'
import { getCurrentStage } from '@/features/journey/stages.config'

// In-memory stand-in for the list, report and operations APIs during the UI phase.
// Journey-based lists (in-process, MIS, dashboard counts) follow the forms filled in this tab;
// the rest is fixed sample data that the actions below change, so each flow can be tried.

const wait = <T>(value: T, ms = 400) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))

export interface StandardFilterValues {
  formNo: string
  pan: string
  mobile: string
  email: string
  fromDate: string
  toDate: string
}

interface Identified {
  formNo: string
  pan: string
  mobile: string
  email: string
}

const contains = (value: string, filter: string) => !filter || value.toLowerCase().includes(filter.toLowerCase())

const matchStandard = <T extends Identified>(rows: T[], filters: StandardFilterValues) =>
  rows.filter(
    (row) =>
      contains(row.formNo, filters.formNo) &&
      contains(row.pan, filters.pan) &&
      contains(row.mobile, filters.mobile) &&
      contains(row.email, filters.email),
  )

// ---------------------------------------------------------------- journey-based report rows

const journeyRows = () =>
  listMockForms().flatMap(({ formNo, skRefNo, inward, progress }) => {
    if (!inward || !skRefNo) return []
    const on = (pairs: [string, string][]) =>
      pairs.filter(([flag]) => flag === 'Y').map(([, label]) => label).join(', ')
    const stage = getCurrentStage(progress)
    return [
      {
        formNo,
        skRefNo,
        pan: inward.panNo,
        email: inward.emailId,
        mobile: inward.mobileNo,
        clientName: inward.nameAsPerPan,
        branchCode: inward.branchCode,
        nriType: on([
          [inward.nrePis, 'NRE PIS'], [inward.nreNonPis, 'NRE NONPIS'],
          [inward.nroPis, 'NRO PIS'], [inward.nroNonPis, 'NRO NONPIS'],
        ]),
        products: on([[inward.eqFlag, 'Equity'], [inward.mfFlag, 'MF'], [inward.fnoFlag, 'FNO']]),
        status: stage ? 'INPROCESS' : 'SUBMITTED',
        nextStage: stage?.title ?? '',
      },
    ]
  })

const SAMPLE_MIS_ROWS = [
  {
    formNo: 'NRI000090', skRefNo: '100012', pan: 'AAAPL1111C', email: 'lata.m@example.com', mobile: '9820011111',
    clientName: 'LATA MOHAN MENON', branchCode: 'MUM01', nriType: 'NRE PIS', products: 'Equity',
    status: 'ACCOUNT OPENED', nextStage: '',
  },
  {
    formNo: 'NRI000091', skRefNo: '100013', pan: 'BBBPM2222D', email: 'sanjay.k@example.com', mobile: '9820022222',
    clientName: 'SANJAY KAPOOR', branchCode: 'MUM01', nriType: 'NRO NONPIS', products: 'MF, FNO',
    status: 'UNDER SCRUTINY', nextStage: '',
  },
]

// ---------------------------------------------------------------- fixed sample data

const pdfRows = [
  {
    formNo: 'NRI000095', skRefNo: '100020', pan: 'CCCPN3333E', clientName: 'FARHAN ALI SHAIKH',
    email: 'farhan@example.com', mobile: '9820033333', pdfType: 'Signed KYC PDF', cooldown: '',
    objections: ['Signature on page 4 does not match the PAN card.', 'Page 7 is missing.'],
    remarks: 'Please upload the complete signed form.',
  },
  {
    formNo: 'NRI000096', skRefNo: '100021', pan: 'DDDPR4444F', clientName: 'MEERA RAJAN IYER',
    email: 'meera@example.com', mobile: '9820044444', pdfType: 'PDF With Bank Details', cooldown: '',
    objections: [] as string[], remarks: '',
  },
  {
    formNo: 'NRI000097', skRefNo: '100022', pan: 'EEEPS5555G', clientName: 'ARJUN SINGH',
    email: 'arjun@example.com', mobile: '9820055555', pdfType: 'Signed KYC PDF', cooldown: '00:14:30',
    objections: ['Photograph is not signed across.'], remarks: '',
  },
]

const livelinessRows = [
  {
    formNo: 'NRI000098', skRefNo: '100030', pan: 'FFFPT6666H', holderType: 'TRD', clientName: 'ROHAN TIWARI',
    email: 'rohan@example.com', mobile: '9820066666', mailLastSentOn: '', isEmailVerified: false, canSendMail: true,
  },
  {
    formNo: 'NRI000099', skRefNo: '100031', pan: 'GGGPV7777J', holderType: 'TRD', clientName: 'KAVITA VARMA',
    email: 'kavita@example.com', mobile: '9820077777', mailLastSentOn: '08/10/2026 11:20', isEmailVerified: true,
    canSendMail: true,
  },
  {
    formNo: 'NRI000099', skRefNo: '100031', pan: 'HHHPV8888K', holderType: '2ND', clientName: 'NIKHIL VARMA',
    email: 'nikhil@example.com', mobile: '9820088888', mailLastSentOn: '09/10/2026 16:05', isEmailVerified: false,
    canSendMail: false,
  },
]

const courierRow = (formNo: string, skRefNo: string, pan: string, clientName: string, email: string, mobile: string) => ({
  formNo, skRefNo, pan, clientName, email, mobile,
  nriType: 'NRE PIS', branchName: 'Mumbai - Fort', products: 'Equity', punchDate: '02/10/2026',
})

const courierRows = {
  client: [
    courierRow('NRI000101', '100040', 'JJJPW1212L', 'DIVYA WAGLE', 'divya@example.com', '9820012121'),
    courierRow('NRI000102', '100041', 'KKKPX3434M', 'HARSH XAVIER', 'harsh@example.com', '9820034343'),
  ],
  ho: [courierRow('NRI000100', '100039', 'LLLPY5656N', 'ISHA YADAV', 'isha@example.com', '9820056565')],
}

export type CourierType = keyof typeof courierRows

const accountRows = [
  {
    formNo: 'NRI000090', customerId: '2001450', loginId: 'LATAM01', clientName: 'LATA MOHAN MENON', s2kId: 'S2K88001',
    branchName: 'Mumbai - Fort', branchCode: 'MUM01', leadId: '45001', pan: 'AAAPL1111C', formStatus: 'Account Opened',
    formStatusId: '5', accountStatus: 'Active', lockRemarks: '', accountOpenDate: '18/09/2026', updateDate: '18/09/2026',
    nriType: 'NRE PIS', branchId: '501', accountType: 'Individual', products: 'Equity', mobile: '9820011111',
    email: 'lata.m@example.com',
  },
  {
    formNo: 'NRI000091', customerId: '', loginId: '', clientName: 'SANJAY KAPOOR', s2kId: '',
    branchName: 'Mumbai - Fort', branchCode: 'MUM01', leadId: '45002', pan: 'BBBPM2222D', formStatus: 'Under Scrutiny',
    formStatusId: '3', accountStatus: '', lockRemarks: '', accountOpenDate: '', updateDate: '05/10/2026',
    nriType: 'NRO NONPIS', branchId: '501', accountType: 'Individual', products: 'MF, FNO', mobile: '9820022222',
    email: 'sanjay.k@example.com',
  },
]

const ADDRESS = { Address1: '12 MG Road', Address2: 'Fort', City: 'Mumbai', State: 'Maharashtra', Country: 'India', Pincode: '400001' }

const accountDetail = {
  ClientData: {
    PANNAME: 'LATA MOHAN MENON', FORMNO: 'NRI000090', PANNO: 'AAAPL1111C', S2K_ID: 'S2K88001',
    FORM_STATUS: 'Account Opened', ACCOUNT_STATUS: 'Active', CustomerID: '2001450', LOGIN_ID: 'LATAM01',
    DOB: '12/03/1984', GENDER: 'Female', MOBILE: '9820011111', EmailID: 'lata.m@example.com', NATIONALITY: 'Indian',
    OCCUPATION: 'Private Sector Service', MARITAL_STATUS: 'Married', FATHER_NAME: 'MOHAN MENON',
    RESIDENTIAL_STATUS: 'NRI', BRANCH_CODE: 'MUM01', BRANCH_NAME: 'Mumbai - Fort', ACCT_OPEN_DATE: '18/09/2026',
    ACCOUNT_TYPE: 'Individual', NRI_TYPE: 'NRE PIS', KYC_STATUS: 'Verified', KYCNO: 'KYC00012345',
    CKYC_KIN: '50012345678901', NOMINEE_AVAILABLE: 'Yes', SALES_EXECUTIVE: 'SE123', CONTRACT_NOTE: 'Digital',
    PRODUCTS: 'Equity', INCOME_SLAB: '10 - 25 Lakh', NET_WORTH: '4500000', NET_WORTH_DATE: '01/08/2026',
    SOURCE_OF_WEALTH: 'Salary', KRA_STATUS: 'KRA Verified', KRA_AGENCY: 'CVL KRA', CITIZENSHIP: 'India',
  },
  RegisteredAddressDetails: ADDRESS,
  CommunicationAddressDetails: { ...ADDRESS, Address1: 'Flat 9, Marina Heights', City: 'Dubai', State: 'Dubai', Country: 'United Arab Emirates', Pincode: '111111' },
  ClientJurisdictionDetails: { CountryOfResidence: 'United Arab Emirates', PlaceOfBirth: 'Kochi', CountryOfBirth: 'India', TaxId: 'AE-784-1984' },
  BankDetails: [
    { BankName: 'HDFC Bank', AccountNumber: '000111222333', AccountType: 'Savings', IFSC: 'HDFC0000001', MICR: '400240002', BranchName: 'Fort, Mumbai', Status: 'Active', Default: 'Yes', ProofUploaded: 'Yes', UpiVpa: '', ImpsFlag: 'Y', ReversePennyFlag: 'N' },
  ],
  FATCADetail: [
    { ClientCode: '2001450', HolderType: 'TRD', Nationality: 'Indian', CountryOfBirth: 'India', PlaceOfBirth: 'KOCHI', Occupation: 'Private Sector Service', PepStatus: 'Non PEP', TaxResidency: 'United Arab Emirates', TIN: 'AE-784-1984' },
  ],
  DocProofDetails: [
    { SrNo: '1', ProofName: 'PAN Card', ProofNumber: 'AAAPL1111C', DateOfIssue: '', DateOfExpiry: '', PlaceOfIssue: '' },
    { SrNo: '2', ProofName: 'Passport', ProofNumber: 'P1234567', DateOfIssue: '15/01/2020', DateOfExpiry: '14/01/2030', PlaceOfIssue: 'Mumbai' },
  ],
  DPDetail: [
    { DpName: 'SHAREKHAN LIMITED', DpIdNumber: 'IN300513', DpType: 'NSDL', DpBeneficiaryName: 'LATA MOHAN MENON', ClientBenficiaryId: '12345678', DpWithClientId: 'IN30051312345678', Status: 'Active', IsDefault: 'Yes', Poa: 'No', Bsda: 'No', InvesttigerStatus: 'Active' },
  ],
  NomineeDetail: [
    { NomineeName: 'MOHAN MENON', Share: '100', Relation: 'Father', DateOfBirth: '02/02/1955', Address: '12 MG Road, Mumbai', Mobile: '9820099999', Guardian: '' },
  ],
  'Client Extra Detail': { IpvEmpCode: 'E1003', IpvDate: '10/09/2026', OsvStaff: 'E1001', OsvDate: '10/09/2026', CountryOfResidence: 'United Arab Emirates', NatureOfBusiness: '' },
}

export type AccountDetail = typeof accountDetail

const formVersions = [
  { value: '5', label: 'NRI Form v5 (2026)' },
  { value: '4', label: 'NRI Form v4 (2025)' },
]

// ---------------------------------------------------------------- mock API

export const operationsMock = {
  getDashboardCounts: () => {
    const forms = listMockForms().filter((form) => form.inward)
    const inProcess = forms.filter((form) => getCurrentStage(form.progress)).length
    return wait({
      InprocessFormsCount: inProcess,
      WaitingForDataFormsCount: inProcess,
      DataObjections: forms.filter((form) => form.hasObjections).length,
      LivelinessPending: livelinessRows.filter((row) => row.isEmailVerified || row.holderType !== 'TRD').length,
      EmailVerificationPending: livelinessRows.filter((row) => !row.isEmailVerified && row.holderType === 'TRD').length,
      SignedPDFUploadPending: pdfRows.filter((row) => row.pdfType === 'Signed KYC PDF').length,
      BankPDFUploadPending: pdfRows.filter((row) => row.pdfType !== 'Signed KYC PDF').length,
      PDFObjections: pdfRows.filter((row) => row.objections.length > 0).length,
      CourierFromClientPending: courierRows.client.length,
      CourierToBeSentToHOPending: courierRows.ho.length,
    })
  },

  getFormVersions: () => wait(formVersions),

  /** Unused form numbers: allocated to the branch and not yet taken past the start screen. */
  getAvailableFormNumbers: () => {
    const started = new Set(listMockForms().filter((form) => form.progress.stageId > 0).map((form) => form.formNo))
    return wait(TEST_FORM_NOS.filter((formNo) => !started.has(formNo)))
  },

  generateFormNumber: (_versionId: string) => {
    const next = Math.max(...TEST_FORM_NOS.map((formNo) => Number(formNo.slice(3)))) + 1
    const formNo = `NRI${String(next).padStart(6, '0')}`
    // The journey mock accepts any number in this list, so a generated form can be started.
    TEST_FORM_NOS.push(formNo)
    return wait({ formNo }, 700)
  },

  getInProcessForms: (filters: StandardFilterValues) =>
    wait(matchStandard(journeyRows().filter((row) => row.status === 'INPROCESS'), filters)),

  getMisReport: (filters: StandardFilterValues) => wait(matchStandard([...journeyRows(), ...SAMPLE_MIS_ROWS], filters)),

  getPdfForms: (filters: StandardFilterValues) => wait(matchStandard(pdfRows, filters).map((row) => ({ ...row }))),

  /** A successful upload takes the form off the pending list. */
  uploadPdf: async (formNo: string, onProgress: (percent: number) => void) => {
    for (const percent of [30, 60, 100]) {
      await wait(null, 150)
      onProgress(percent)
    }
    pdfRows.splice(pdfRows.findIndex((row) => row.formNo === formNo), 1)
    return { message: 'Success' }
  },

  /** Resending starts the cooldown, which hides Resend until it runs out. */
  resendPdf: (formNo: string) => {
    const row = pdfRows.find((item) => item.formNo === formNo)
    if (row) row.cooldown = '00:30:00'
    return wait({ message: 'Success' }, 600)
  },

  getLivelinessPending: (filters: StandardFilterValues) =>
    wait(matchStandard(livelinessRows, filters).map((row) => ({ ...row }))),

  sendLivelinessMail: (formNo: string, holderType: string) => {
    const row = livelinessRows.find((item) => item.formNo === formNo && item.holderType === holderType)
    if (!row) return Promise.reject(new ApiError({ message: 'Record not found.' }))
    row.mailLastSentOn = new Date().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
    return wait({ message: 'Success' }, 600)
  },

  /** The mock treats a sent verification mail as verified, so the liveliness button appears next. */
  sendVerificationMail: (formNo: string, pan: string) => {
    const row = livelinessRows.find((item) => item.formNo === formNo && item.pan === pan)
    if (row) row.isEmailVerified = true
    return wait({ message: 'Success' }, 600)
  },

  getCourierForms: (type: CourierType, filters: StandardFilterValues) =>
    wait(matchStandard(courierRows[type], filters).map((row) => ({ ...row }))),

  /** Received from the client → now waits to go to HO. Sent to HO → leaves the list. */
  saveCourier: (type: CourierType, formNo: string) => {
    const index = courierRows[type].findIndex((row) => row.formNo === formNo)
    const [row] = index >= 0 ? courierRows[type].splice(index, 1) : []
    if (row && type === 'client') courierRows.ho.push(row)
    return wait({ message: 'Success' }, 600)
  },

  getFormStatuses: () =>
    wait([
      { value: '1', label: 'In Process' },
      { value: '3', label: 'Under Scrutiny' },
      { value: '5', label: 'Account Opened' },
    ]),

  searchAccounts: (filters: Record<string, string>) => {
    const fields: [string, keyof (typeof accountRows)[number]][] = [
      ['customerId', 'customerId'], ['s2kId', 's2kId'], ['formNumber', 'formNo'], ['loginId', 'loginId'],
      ['mobileNo', 'mobile'], ['panNo', 'pan'], ['emailId', 'email'],
    ]
    return wait(
      accountRows.filter(
        (row) =>
          fields.every(([filter, field]) => contains(row[field], filters[filter] ?? '')) &&
          (!filters.formStatusId || row.formStatusId === filters.formStatusId),
      ),
    )
  },

  getAccountDetail: (customerId: string, formNo: string): Promise<AccountDetail> => {
    const known = accountRows.some((row) => (customerId ? row.customerId === customerId : row.formNo === formNo))
    return known && (customerId || formNo)
      ? wait(accountDetail, 600)
      : new Promise((_, reject) =>
          setTimeout(() => reject(new ApiError({ message: 'Failed to load account details.' })), 400),
        )
  },
}
