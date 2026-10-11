import { ApiError } from '@/api'
import type { AddressRequest } from './stages/address/types'
import type { FormInwardPayload } from './stages/inward/types'
import type { BankBranch, BrokerageCharges, EmployeeSign } from './types'
import type { Journey, JourneyProgress, PanDetails, YesNo } from './types'

// In-memory stand-in for the backend during the UI phase. It keeps saved stages for the life
// of the tab so the journey can be walked end to end. Removed when services.ts calls the API.

interface MockForm {
  skRefNo: string | null
  stageId: number
  holderCount: number
  isBankAvailable: YesNo | ''
  inward?: FormInwardPayload
  address?: AddressRequest
  /** Save payloads of the later stages, by stage key. Kept only so they can be inspected. */
  payloads: Record<string, unknown>
  /** What each stage showed when it was saved, for view mode. */
  views: Record<string, unknown>
  /** Scrutiny objections by stage id. Undefined until the mock raises its sample set. */
  objections?: Record<number, MockStageObjections>
}

interface MockStageObjections {
  remarks: string
  objections: { id: string; text: string }[]
}

let nextObjectionId = 12

/**
 * The real objections come from back-office scrutiny. So the screens can be tried, the mock
 * raises a sample set on Inward and Address the first time a form that has saved both is listed.
 */
const raiseSampleObjections = (form: MockForm) => {
  if (form.objections || form.stageId < 2) return
  const objection = (text: string) => ({ id: String(nextObjectionId++), text })
  form.objections = {
    1: {
      remarks: 'Please re-check the contact details against the application form.',
      objections: [
        objection('Email ID does not match the application form.'),
        objection('Father / spouse name is incomplete.'),
      ],
    },
    2: { remarks: '', objections: [objection('Permanent address pincode does not match the address proof.')] },
  }
}

const hasOpenObjections = (form: MockForm) =>
  Object.values(form.objections ?? {}).some((stage) => stage.remarks || stage.objections.length > 0)

const forms = new Map<string, MockForm>()
let nextSkRefNo = 100045

/** Form numbers the mock backend accepts while the UI is built without the API. */
export const TEST_FORM_NOS = ['NRI000123', 'NRI000124', 'NRI000125', 'NRI000126', 'NRI000127']

/** Primary-applicant PANs the mock verifies, with the name and date of birth it returns. */
export const TEST_PANS: Record<string, { name: string; dob: string }> = {
  ABCPE1234F: { name: 'RAHUL KUMAR SHARMA', dob: '15/01/1990' },
  BCDPF2345G: { name: 'NEHA SURESH PATEL', dob: '22/07/1988' },
  CDEPG3456H: { name: 'VIKRAM RAO', dob: '03/11/1979' },
  DEFPH4567J: { name: 'ANITA RAJESH DESAI', dob: '30/04/1995' },
  EFGPK5678L: { name: 'MOHAMMED IMRAN KHAN', dob: '09/09/1985' },
}
/** PANs the mock accepts for the 2nd and 3rd holder. */
export const TEST_HOLDER_PANS: Record<string, string> = {
  ABCPH1234K: 'PRIYA RAHUL SHARMA',
  ABCPJ5678L: 'AMIT KUMAR SHARMA',
}
/** Staff codes with an e-sign on record, for the OSV / interview / IPV blocks. */
export const TEST_STAFF: Record<string, { name: string; designation: string }> = {
  E1001: { name: 'Sunita Verma', designation: 'Branch Manager' },
  E1002: { name: 'Karan Mehta', designation: 'Relationship Manager' },
  E1003: { name: 'Deepa Nair', designation: 'Compliance Officer' },
}

export const TEST_BROKERAGE_SCHEMES = [
  { value: '1', label: 'NRI Classic Plan' },
  { value: '2', label: 'NRI Prime Plan' },
  { value: '3', label: 'NRI Trade Tiger Plan' },
]

/** IFSC codes the mock can find. */
export const TEST_BRANCHES: Record<string, BankBranch> = {
  HDFC0000001: { ifsc: 'HDFC0000001', branchId: '3456', bankName: 'HDFC Bank', branchName: 'Fort, Mumbai' },
  ICIC0000002: { ifsc: 'ICIC0000002', branchId: '4567', bankName: 'ICICI Bank', branchName: 'Andheri, Mumbai' },
  KKBK0000003: { ifsc: 'KKBK0000003', branchId: '5678', bankName: 'Kotak Mahindra Bank', branchName: 'Camp, Pune' },
}

const wait = <T>(value: T, ms = 400) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
const fail = (message: string) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new ApiError({ message })), 400))

const formOf = (formNo: string) => {
  let form = forms.get(formNo)
  if (!form) {
    form = { skRefNo: null, stageId: 0, holderCount: 1, isBankAvailable: '', payloads: {}, views: {} }
    forms.set(formNo, form)
  }
  return form
}

const progressOf = ({ stageId, inward, holderCount, isBankAvailable }: MockForm): JourneyProgress => ({
  stageId,
  pan: inward?.panNo ?? '',
  holderCount,
  nriCategory: inward?.nriCategory ?? '',
  email: inward?.emailId ?? '',
  isBankAvailable,
  nriTypes: {
    nrePis: inward?.nrePis === 'Y',
    nreNonPis: inward?.nreNonPis === 'Y',
    nroPis: inward?.nroPis === 'Y',
    nroNonPis: inward?.nroNonPis === 'Y',
  },
})

export const journeyMock = {
  getJourney: (formNo: string): Promise<Journey> => {
    if (!TEST_FORM_NOS.includes(formNo)) {
      return fail(`Form number is not valid. Use a test form number: ${TEST_FORM_NOS.join(', ')}.`)
    }
    const form = formOf(formNo)
    return wait({ formNo, skRefNo: form.skRefNo, progress: progressOf(form) })
  },

  saveInward: (payload: FormInwardPayload) => {
    const form = formOf(payload.formNo)
    form.skRefNo ??= String(nextSkRefNo++)
    form.inward = payload
    form.stageId = Math.max(form.stageId, 1)
    return wait({ skReferenceNo: form.skRefNo })
  },

  getInward: (formNo: string) => wait(formOf(formNo).inward ?? null),

  saveAddress: (formNo: string, request: AddressRequest) => {
    const form = formOf(formNo)
    form.address = request
    form.stageId = Math.max(form.stageId, 2)
    return wait({ message: 'Success' })
  },

  getAddress: (formNo: string) => wait(formOf(formNo).address ?? null),

  getObjectionForms: (filters: { formNo?: string; pan?: string; mobile?: string; email?: string }) => {
    const matches = (value: string, filter?: string) => !filter || value.toLowerCase().includes(filter.toLowerCase())
    const rows = [...forms.entries()].flatMap(([formNo, form]) => {
      raiseSampleObjections(form)
      const { inward } = form
      if (!inward || !form.skRefNo || !hasOpenObjections(form)) return []
      const flags: [string, string][] = [
        [inward.nrePis, 'NRE PIS'], [inward.nreNonPis, 'NRE NONPIS'], [inward.nroPis, 'NRO PIS'], [inward.nroNonPis, 'NRO NONPIS'],
      ]
      const products: [string, string][] = [[inward.eqFlag, 'Equity'], [inward.mfFlag, 'MF'], [inward.fnoFlag, 'FNO']]
      const on = (list: [string, string][]) => list.filter(([flag]) => flag === 'Y').map(([, label]) => label).join(', ')
      return [{
        formNo,
        skRefNo: form.skRefNo,
        pan: inward.panNo,
        clientName: inward.nameAsPerPan,
        nriType: on(flags),
        products: on(products),
        punchDate: new Date().toLocaleDateString('en-GB'),
        email: inward.emailId,
        mobile: inward.mobileNo,
      }]
    })
    return wait(
      rows.filter(
        (row) =>
          matches(row.formNo, filters.formNo) && matches(row.pan, filters.pan) &&
          matches(row.mobile, filters.mobile) && matches(row.email, filters.email),
      ),
    )
  },

  getObjections: (formNo: string) => {
    const form = formOf(formNo)
    raiseSampleObjections(form)
    return wait(structuredClone(form.objections ?? {}))
  },

  closeObjection: (formNo: string, objectionId: string) => {
    for (const stage of Object.values(formOf(formNo).objections ?? {})) {
      stage.objections = stage.objections.filter((item) => item.id !== objectionId)
      // A stage's remark goes with its last objection.
      if (stage.objections.length === 0) stage.remarks = ''
    }
    return wait({ Message: 'Success' })
  },

  /** Stages 3 onward: record the payload and move the form forward. */
  saveStage: (
    formNo: string,
    stageKey: string,
    stageId: number,
    payload: unknown,
    /** Progress facts the real backend derives from the saved stage. */
    facts: Partial<Pick<MockForm, 'holderCount' | 'isBankAvailable'>> = {},
  ) => {
    const form = formOf(formNo)
    form.payloads[stageKey] = payload
    form.stageId = Math.max(form.stageId, stageId)
    Object.assign(form, facts)
    return wait({ message: 'Success' })
  },

  /** Staff codes in TEST_STAFF have an e-sign on record; any other code has none. */
  lookupEmployeeSign: (code: string): Promise<EmployeeSign | null> => {
    const staff = TEST_STAFF[code.toUpperCase()]
    return wait(
      staff
        ? { ...staff, signature: { filePath: `esign/${code.toUpperCase()}.jpg`, fileName: `${code.toUpperCase()}-signature.jpg` } }
        : null,
      600,
    )
  },

  getBrokerageSchemes: () => wait(TEST_BROKERAGE_SCHEMES),

  getBrokerageCharges: (schemeId: string): Promise<BrokerageCharges> => {
    const scheme = TEST_BROKERAGE_SCHEMES.find((item) => item.value === schemeId)
    const rate = (base: number) => `${(base * (Number(schemeId) || 1)).toFixed(2)}%`
    return wait({
      name: scheme?.label ?? '',
      cash_delivery: rate(0.1), cash_intraday: rate(0.01), cash_futures: rate(0.01), cash_options: 'Rs. 20 per lot',
      currency_futures: rate(0.005), currency_options: 'Rs. 10 per lot', mcx_futures: rate(0.01), mcx_options: 'Rs. 20 per lot',
      dp_operating_charges: 'Rs. 400 per year', ongoing_isin: 'Rs. 25 per ISIN',
      mtf_pledge_unpledge: 'Rs. 20 per ISIN', margin_pledge_unpledge: 'Rs. 20 per ISIN',
      accountopening: 'Nil', mtf_upto_25_lakhs: '18% p.a.', mtf_upto_25_lakhs_5_crore: '15% p.a.',
      mtf_above_5_crore: '12% p.a.', margin_pledge: '18% p.a.', delayed_payment_charges: '18% p.a.',
    })
  },

  findIfsc: (ifsc: string): Promise<BankBranch | null> => wait(TEST_BRANCHES[ifsc.toUpperCase()] ?? null, 500),

  /** Account numbers ending in 0000 fail the bank check. */
  checkBank: (accountNo: string) =>
    accountNo.endsWith('0000') ? fail('Bank account could not be validated (sample failure).') : wait(true, 800),

  rememberView: (formNo: string, stageKey: string, view: unknown) => {
    formOf(formNo).views[stageKey] = view
  },

  getView: (formNo: string, stageKey: string) => wait(formOf(formNo).views[stageKey] ?? null),

  checkHolderPan: (pan: string): Promise<PanDetails> => {
    const name = TEST_HOLDER_PANS[pan]
    return name
      ? wait({ dob: '20/06/1992', nameAsPerPan: name, seedingStatus: 'Y' }, 700)
      : fail(`PAN could not be verified. Use a test holder PAN: ${Object.keys(TEST_HOLDER_PANS).join(' or ')}.`)
  },

  /** TINs ending in 0000 are rejected. */
  validateTin: (tin: string) =>
    tin.endsWith('0000') ? fail('TIN structure is not valid for this country (sample failure).') : wait(true, 600),

  upload: async (fileName: string, folder: string, onProgress: (percent: number) => void) => {
    for (const percent of [25, 50, 75, 100]) {
      await wait(null, 120)
      onProgress(percent)
    }
    return { filePath: `${folder}/${Date.now()}_${fileName}`, fileName }
  },

  /** Only the test PANs verify; any other PAN shows the failure state. */
  checkPan: (pan: string): Promise<PanDetails> => {
    const person = TEST_PANS[pan]
    return person
      ? wait({ dob: person.dob, nameAsPerPan: person.name, seedingStatus: 'Y' }, 700)
      : fail(`PAN could not be verified. Use a test PAN: ${Object.keys(TEST_PANS).join(', ')}.`)
  },

  /** Values containing "fail" (email) or ending in 0000 (mobile, codes) are rejected. */
  checkContact: (value: string) =>
    /fail/i.test(value) || value.endsWith('0000')
      ? fail('Already registered with another client (sample failure).')
      : wait(true, 600),

  validateCode: (code: string) =>
    code.endsWith('0000') ? fail('Code not found for this branch (sample failure).') : wait(true, 600),
}

/** For the list and dashboard mocks: every form this tab has opened, with its progress. */
export const listMockForms = () =>
  [...forms.entries()].map(([formNo, form]) => {
    raiseSampleObjections(form)
    return {
      formNo,
      skRefNo: form.skRefNo,
      inward: form.inward,
      progress: progressOf(form),
      hasObjections: hasOpenObjections(form),
    }
  })
