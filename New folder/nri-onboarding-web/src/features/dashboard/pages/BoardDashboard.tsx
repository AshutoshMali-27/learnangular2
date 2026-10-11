import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CountsError, DashboardHeading } from '../components/parts'
import { share, show } from '../dashboard.config'
import { useDashboard } from '../hooks/useDashboard'

/** Board layout: one column per phase, one card per queue, read left to right. */
export default function BoardDashboard() {
  const data = useDashboard()

  return (
    <div className="grid gap-4 lg:gap-6">
      <DashboardHeading title="Work board" description="Each column is a phase of the journey; each card is a queue to work." />
      <CountsError data={data} />

      <div className="scrollbar-slim -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0">
        {data.phases.map((phase, index) => (
          <section
            key={phase.title}
            aria-label={phase.title}
            className="grid w-[min(19rem,82vw)] shrink-0 snap-start content-start gap-3 rounded-2xl bg-muted/70 p-3 xl:w-auto"
          >
            <header className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-xs">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <phase.icon className="size-5" />
              </span>
              <div className="grid min-w-0 flex-1 leading-tight">
                <h2 className="truncate font-semibold tracking-tight">{phase.title}</h2>
                <p className="text-xs text-muted-foreground">Phase {index + 1}</p>
              </div>
              <span className="rounded-full bg-brand px-2.5 py-0.5 text-sm font-semibold text-brand-foreground tabular-nums">
                {show(phase.total)}
              </span>
            </header>

            {phase.queues.map((queue) => (
              <Link
                key={queue.countKey}
                to={queue.to}
                className="group grid gap-3 rounded-xl border bg-card p-4 shadow-xs transition-all outline-none hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <queue.icon className="size-4 shrink-0 text-primary" />
                  <span className="flex-1">{queue.label}</span>
                </span>
                <span className="flex items-end justify-between gap-3">
                  <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums">{show(queue.count)}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary">
                    Open
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
                <span aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${share(queue.count, data.max)}%` }} />
                </span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
