import { ChevronRight, Flame } from 'lucide-react'
import { AttentionList, CountsError, DashboardHero, Panel, QueueRow, QuickActions } from '../components/parts'
import { show } from '../dashboard.config'
import { useDashboard, type DashboardData } from '../hooks/useDashboard'

/** The journey of a form as connected phases, each listing the queues waiting in it. */
function Pipeline({ data }: { data: DashboardData }) {
  return (
    <ol className="grid gap-4 lg:grid-cols-4 lg:gap-0">
      {data.phases.map((phase, index) => {
        const Icon = phase.icon
        const last = index === data.phases.length - 1

        return (
          <li key={phase.title} className="relative grid content-start gap-3 lg:px-3 lg:first:pl-0 lg:last:pr-0">
            {/* Phase marker with the connector to the next phase. */}
            <div className="flex items-center gap-3">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Icon className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-brand text-[0.65rem] font-bold text-brand-foreground ring-2 ring-card">
                  {index + 1}
                </span>
              </span>
              {!last && (
                <span aria-hidden className="hidden flex-1 items-center lg:flex">
                  <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-primary/60 to-primary/15" />
                  <ChevronRight className="-ml-1 size-4 text-primary/50" />
                </span>
              )}
              <span className="ml-auto text-2xl leading-none font-semibold tabular-nums lg:hidden">
                {show(phase.total)}
              </span>
            </div>

            <div className="grid gap-0.5">
              <h3 className="flex items-baseline justify-between gap-2 font-semibold tracking-tight">
                {phase.title}
                <span className="hidden text-2xl tabular-nums lg:inline">{show(phase.total)}</span>
              </h3>
              <p className="text-xs text-muted-foreground">{phase.hint}</p>
            </div>

            <div className="-mx-2.5 grid gap-0.5">
              {phase.queues.map((queue) => (
                <QueueRow key={queue.countKey} queue={queue} max={data.max} />
              ))}
            </div>

            {!last && <span aria-hidden className="h-px bg-border lg:hidden" />}
          </li>
        )
      })}
    </ol>
  )
}

/** Pipeline layout: the queues laid out along the path a form takes. */
export default function Dashboard() {
  const data = useDashboard()

  return (
    <div className="grid gap-4 lg:gap-6">
      <DashboardHero data={data} eyebrow="Pipeline dashboard" />
      <CountsError data={data} />

      <Panel
        title="Onboarding pipeline"
        description="Forms waiting in each phase. Bars compare the queues; select one to work on it."
      >
        <Pipeline data={data} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
        <Panel title="Needs attention" icon={<Flame className="size-5 text-brand" />}>
          <AttentionList data={data} />
        </Panel>
        <Panel title="Quick actions">
          <QuickActions />
        </Panel>
      </div>
    </div>
  )
}
