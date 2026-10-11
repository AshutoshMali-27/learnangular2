import { operationsMock } from '@/mocks/operations.mock'

/** Work-queue counts for the branch, keyed as `Home/GetDashboardCounts` returns them. */
export type DashboardCounts = Record<string, number>

export const DASHBOARD_QUERY_KEYS = { COUNTS: ['dashboard', 'counts'] } as const

// UI phase: resolves from the mock. API integration calls API_ENDPOINTS.HOME.DASHBOARD_COUNTS
// (POST, no body; the server uses the session branch) and returns its `data`.
export const dashboardService = {
  getCounts: (): Promise<DashboardCounts> => operationsMock.getDashboardCounts(),
}
