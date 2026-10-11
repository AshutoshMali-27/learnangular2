import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CountsError, DashboardHeading, Panel } from '../components/parts'
import { PHASE_TINT, share, show } from '../dashboard.config'
import { useDashboard, type DashboardData } from '../hooks/useDashboard'

function StatTile({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border bg-card p-5 shadow-xs">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="truncate text-3xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dd className="truncate text-xs text-muted-foreground">{note}</dd>
    </div>
  )
}

/** Every queue as a horizontal bar, largest first. */
function QueueChart({ data }: { data: DashboardData }) {
  const rows = [...data.queues].sort((a, b) => (b.count ?? 0) - (a.count ?? 0))

  return (
    <ul className="grid gap-1">
      {rows.map((queue) => (
        <li key={queue.countKey}>
          <Link
            to={queue.to}
            title={`${queue.label}: ${show(queue.count)} (${queue.phase})`}
            className="group grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-lg px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_2.5rem]"
          >
            <span className="truncate text-sm text-muted-foreground group-hover:text-foreground">{queue.label}</span>
            <span aria-hidden className="h-5 border-l border-border">
              <span
                className="block h-full rounded-r-sm bg-primary transition-[width] duration-500 group-hover:opacity-85"
                style={{ width: `${share(queue.count, data.max)}%` }}
              />
            </span>
            <span className="text-right text-sm font-semibold tabular-nums">{show(queue.count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Share of waiting work per phase: one stacked bar plus a legend that doubles as the table. */
function PhaseMix({ data }: { data: DashboardData }) {
  const waiting = data.waiting ?? 0

  return (
    <div className="grid gap-5">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label="Share of waiting work by phase">
        {data.phases.map((phase, index) =>
          phase.total ? (
            <span
              key={phase.title}
              title={`${phase.title}: ${phase.total}`}
              className={cn('h-full bg-primary', PHASE_TINT[index])}
              style={{ width: `${(phase.total / waiting) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <dl className="grid gap-3">
        {data.phases.map((phase, index) => (
          <div key={phase.title} className="flex items-center gap-3 text-sm">
            <span aria-hidden className={cn('size-3 shrink-0 rounded-sm bg-primary', PHASE_TINT[index])} />
            <dt className="flex-1 text-muted-foreground">{phase.title}</dt>
            <dd className="font-semibold tabular-nums">{show(phase.total)}</dd>
            <dd className="w-11 text-right text-xs text-muted-foreground tabular-nums">
              {waiting && phase.total !== undefined ? `${Math.round((phase.total / waiting) * 100)}%` : '–'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Analytics layout: headline figures and charts that compare the queues. */
export default function AnalyticsDashboard() {
  const data = useDashboard()
  const busiest = data.ranked[0]
  const clear = data.queues.filter((queue) => queue.count === 0).length

  return (
    <div className="grid gap-4 lg:gap-6">
      <DashboardHeading title="Analytics" description="How the waiting work is spread across queues and phases." />
      <CountsError data={data} />

      <dl className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
        <StatTile label="Accounts under process" value={show(data.inProcess)} note="Forms not yet completed" />
        <StatTile label="Items waiting" value={show(data.waiting)} note="Across all queues" />
        <StatTile
          label="Busiest queue"
          value={busiest?.count ?? show(undefined)}
          note={busiest?.label ?? 'Nothing is waiting'}
        />
        <StatTile
          label="Queues clear"
          value={data.loaded ? `${clear} / ${data.queues.length}` : show(undefined)}
          note="With nothing waiting"
        />
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <Panel title="Queues by volume" description="Largest first. Select a bar to open that queue.">
          <QueueChart data={data} />
        </Panel>
        <Panel title="Work by phase" description="Where the waiting items sit along the journey.">
          <PhaseMix data={data} />
        </Panel>
      </div>
    </div>
  )
}
