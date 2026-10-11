import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CountsError, DashboardHero } from '../components/parts'
import { show } from '../dashboard.config'
import { useDashboard } from '../hooks/useDashboard'

/** Overview layout: a summary strip of the four phases, then one card per queue. */
export default function OverviewDashboard() {
  const data = useDashboard()

  return (
    <div className="grid gap-4 lg:gap-6">
      <DashboardHero data={data} eyebrow="Overview dashboard" />
      <CountsError data={data} />

      {/* One strip, four phases: totals at a glance. */}
      <dl className="grid divide-y overflow-hidden rounded-2xl border bg-card shadow-xs sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {data.phases.map((phase, index) => (
          <div key={phase.title} className="flex items-center gap-4 p-5 sm:even:border-l sm:[&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <phase.icon className="size-5" />
            </span>
            <div className="grid min-w-0 leading-tight">
              <dt className="truncate text-sm text-muted-foreground">
                <span className="font-semibold text-brand">{index + 1}.</span> {phase.title}
              </dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{show(phase.total)}</dd>
            </div>
          </div>
        ))}
      </dl>

      {data.phases.map((phase) => (
        <section key={phase.title} className="grid gap-3" aria-label={phase.title}>
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            <span aria-hidden className="h-3.5 w-1 rounded-full bg-brand" />
            {phase.title}
            <span aria-hidden className="h-px flex-1 bg-border" />
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
            {phase.queues.map((queue) => (
              <Link
                key={queue.countKey}
                to={queue.to}
                className="group relative grid gap-5 overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-all outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <queue.icon aria-hidden className="absolute -right-4 -bottom-5 size-24 text-primary/[0.06] transition-transform group-hover:scale-110" />
                <span className="flex items-start justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <queue.icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </span>
                <span className="relative grid gap-0.5">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums">{show(queue.count)}</span>
                  <span className="text-sm text-muted-foreground">{queue.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
