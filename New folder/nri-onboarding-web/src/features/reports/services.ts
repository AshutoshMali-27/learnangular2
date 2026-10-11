import type { Option } from '@/components/form'
import type { StandardFilters } from '@/components/shared/StandardFilterFields'
import { operationsMock } from '@/mocks/operations.mock'
import type { AccountDetail, AccountFilters, AccountRow, ReportRow } from './types'

export const REPORT_QUERY_KEYS = {
  IN_PROCESS: (filters: StandardFilters) => ['reports', 'in-process', filters],
  MIS: (filters: StandardFilters) => ['reports', 'mis', filters],
  FORM_STATUSES: ['reports', 'form-statuses'],
  ACCOUNTS: (filters: AccountFilters) => ['reports', 'accounts', filters],
  ACCOUNT_DETAIL: (customerId: string, formNo: string) => ['reports', 'account-detail', customerId, formNo],
} as const

// UI phase: resolves from the mock. Endpoints for API integration are named per function;
// all of them take the filters as the backend's request model and add the session branch server-side.
export const reportService = {
  /** NRIAccountOpening/GetInprocessNRIReportDetails (status forced to in-process). */
  getInProcess: (filters: StandardFilters): Promise<ReportRow[]> => operationsMock.getInProcessForms(filters),

  /** NRIAccountOpening/GetNRIReportDetails (all statuses). */
  getMis: (filters: StandardFilters): Promise<ReportRow[]> => operationsMock.getMisReport(filters),

  /** NRIAccountOpening/getFormStatus (master 52). */
  getFormStatuses: (): Promise<Option[]> => operationsMock.getFormStatuses(),

  /** NRIAccountOpening/getaccountstatusreportsearch. `searched` is a UI flag and is not sent. */
  searchAccounts: ({ searched: _searched, ...filters }: AccountFilters): Promise<AccountRow[]> =>
    operationsMock.searchAccounts(filters),

  /** NRIAccountOpening/getaccountstatusdetailedreports: by customer id, else by form number. */
  getAccountDetail: (customerId: string, formNo: string): Promise<AccountDetail> =>
    operationsMock.getAccountDetail(customerId, formNo),
}
