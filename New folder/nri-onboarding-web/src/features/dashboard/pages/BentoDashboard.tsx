import { ArrowUpRight, Flame, Landmark, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { cn } from '@/lib/utils'
import { AttentionList, CountsError, Panel, QueueRow, QuickActions } from '../components/parts'
import { show } from '../dashboard.config'
import { useDashboard } from '../hooks/useDashboard'

// Where each phase tile sits on the wide grid, so the mosaic is uneven on purpose.
const PHASE_SPAN = ['xl:col-span-2', 'xl:col-span-2', 'xl:col-span-2', 'xl:col-span-3']

/** Bento layout: a mosaic of tiles of different sizes, the headline figure largest. */
export default function BentoDashboard() {
  const data = useDashboard()
  const user = useSessionUser()

  return (
    <div className="grid gap-4 lg:gap-5">
      <CountsError data={data} />

      <div className="grid gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-6">
        {/* Headline tile */}
        <section className="relative grid content-between gap-8 overflow-hidden rounded-3xl bg-hero p-6 shadow-sm sm:p-8 md:col-span-2 xl:col-span-4 xl:row-span-2">
          <Landmark aria-hidden className="absolute -right-8 -bottom-10 size-64 text-white/[0.05]" />
          <div className="relative grid gap-1.5">
            <p className="text-xs font-medium tracking-widest text-white/70 uppercase">Bento dashboard</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {user.empName}</h1>
          </div>
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <Link to="/reports/in-process" className="group grid gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white">
              <span className="text-7xl leading-none font-semibold tracking-tighter tabular-nums sm:text-8xl">
                {show(data.inProcess)}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/75">
                Accounts under process
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
            <dl className="flex gap-6">
              <div className="grid gap-0.5">
                <dt className="text-xs text-white/60">Items waiting</dt>
                <dd className="text-2xl font-semibold tabular-nums">{show(data.waiting)}</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs text-white/60">Active queues</dt>
                <dd className="text-2xl font-semibold tabular-nums">{data.loaded ? data.ranked.length : show(undefined)}</dd>
              </div>
            </dl>
          </div>
          <Button asChild size="lg" className="relative h-10 justify-self-start bg-white px-4 text-[var(--hero-to)] shadow-sm hover:bg-white/90">
            <Link to="/journey">
              <Plus />
              Add New Account
            </Link>
          </Button>
        </section>

        <Panel title="Needs attention" icon={<Flame className="size-5 text-brand" />} className="md:col-span-2 xl:row-span-2">
          <AttentionList data={data} limit={4} />
        </Panel>

        {data.phases.map((phase, index) => (
          <section
            key={phase.title}
            aria-label={phase.title}
            className={cn('grid content-start gap-3 rounded-2xl border bg-card p-5 shadow-xs', PHASE_SPAN[index])}
          >
            <header className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <phase.icon className="size-5" />
              </span>
              <div className="grid min-w-0 flex-1 leading-tight">
                <h2 className="truncate font-semibold tracking-tight">{phase.title}</h2>
                <p className="truncate text-xs text-muted-foreground">{phase.hint}</p>
              </div>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{show(phase.total)}</span>
            </header>
            <div className="-mx-2.5 grid gap-0.5">
              {phase.queues.map((queue) => (
                <QueueRow key={queue.countKey} queue={queue} max={data.max} />
              ))}
            </div>
          </section>
        ))}

        <Panel title="Quick actions" className="md:col-span-2 xl:col-span-3">
          <QuickActions />
        </Panel>
      </div>
    </div>
  )
}
