import type { StandardFilters } from '@/components/shared/StandardFilterFields'
import { operationsMock } from '@/mocks/operations.mock'

/** `client`: forms couriered by the client to the branch. `ho`: forms the branch sends to Head Office. */
export type CourierType = 'client' | 'ho'

export const COURIER_TYPES: { value: CourierType; label: string; backendValue: string }[] = [
  { value: 'client', label: 'Client to Branch', backendValue: 'client to branch' },
  { value: 'ho', label: 'Branch to HO', backendValue: 'branch to ho' },
]

export const toCourierType = (value: string): CourierType => (value === 'ho' ? 'ho' : 'client')

/** One form in a courier list (`GetCuriorDetails`), in app naming. */
export interface CourierForm {
  formNo: string
  skRefNo: string
  pan: string
  clientName: string
  email: string
  mobile: string
  nriType: string
  branchName: string
  products: string
  punchDate: string
}

export interface CourierEntry {
  formNo: string
  awbNo: string
  remark: string
}

export const COURIER_QUERY_KEYS = {
  ALL: ['courier'],
  LIST: (type: CourierType, filters: StandardFilters) => ['courier', type, filters],
} as const

// UI phase: resolves from the mock. Endpoints for API integration are named per function.
export const courierService = {
  /** NRIAccountOpening/GetCuriorDetails with `CourierType` = the type's `backendValue`. */
  getForms: (type: CourierType, filters: StandardFilters): Promise<CourierForm[]> =>
    operationsMock.getCourierForms(type, filters),

  /** NRIAccountOpening/SaveCourierDetails `{ FormNumber, AWBNumber, Remark, CourierType }`. */
  save: (type: CourierType, entry: CourierEntry): Promise<unknown> => operationsMock.saveCourier(type, entry.formNo),
}
