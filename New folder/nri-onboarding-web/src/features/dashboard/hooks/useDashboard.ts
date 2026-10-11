import { useQuery } from '@tanstack/react-query'
import { PHASES } from '../dashboard.config'
import { DASHBOARD_QUERY_KEYS, dashboardService } from '../services'

/** The branch's work-queue counts, shaped for the dashboard layouts. */
export function useDashboard() {
  const { data: counts, isError } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.COUNTS,
    queryFn: dashboardService.getCounts,
  })

  const phases = PHASES.map((phase) => {
    const queues = phase.queues.map((queue) => ({ ...queue, phase: phase.title, count: counts?.[queue.countKey] }))
    return { ...phase, queues, total: counts && queues.reduce((sum, queue) => sum + (queue.count ?? 0), 0) }
  })
  const queues = phases.flatMap((phase) => phase.queues)
  // Largest first; queues with nothing waiting are left out.
  const ranked = queues
    .map((queue) => ({ ...queue, count: queue.count ?? 0 }))
    .filter((queue) => queue.count > 0)
    .sort((a, b) => b.count - a.count)

  return {
    loaded: !!counts,
    isError,
    /** Every form still in progress. */
    inProcess: counts?.InprocessFormsCount,
    phases,
    queues,
    ranked,
    /** Largest single queue, the scale for every bar. */
    max: ranked[0]?.count ?? 0,
    /** Items waiting across all queues. */
    waiting: counts && queues.reduce((sum, queue) => sum + (queue.count ?? 0), 0),
  }
}

export type DashboardData = ReturnType<typeof useDashboard>
export type DashboardPhase = DashboardData['phases'][number]
export type DashboardQueue = DashboardData['queues'][number]
