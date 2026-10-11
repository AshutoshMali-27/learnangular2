import { ArrowRight, ArrowUpRight, Landmark, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { cn } from '@/lib/utils'
import { share, SHORTCUTS, show } from '../dashboard.config'
import type { DashboardData, DashboardQueue } from '../hooks/useDashboard'

const FOCUS = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

/** Titled card every dashboard layout is assembled from. */
export function Panel({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string
  description?: string
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('grid content-start gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6', className)}>
      <div className="grid gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {icon ?? <span aria-hidden className="h-5 w-1 rounded-full bg-brand" />}
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

/** Brand banner: greeting, the main action, and the headline figure. */
export function DashboardHero({ data, eyebrow }: { data: DashboardData; eyebrow: string }) {
  const user = useSessionUser()

  return (
    <header className="relative grid gap-6 overflow-hidden rounded-3xl bg-hero p-5 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <Landmark aria-hidden className="absolute -bottom-10 left-1/2 size-56 text-white/[0.04]" />
      <div className="relative grid justify-items-start gap-4">
        <div className="grid gap-1.5">
          <p className="text-xs font-medium tracking-widest text-white/70 uppercase">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome, {user.empName}</h1>
          <p className="max-w-md text-sm text-white/75">
            Here is where every NRI account opening form stands for your branch today.
          </p>
        </div>
        <Button asChild size="lg" className="h-10 bg-white px-4 text-[var(--hero-to)] shadow-sm hover:bg-white/90">
          <Link to="/journey">
            <Plus />
            Add New Account
          </Link>
        </Button>
      </div>

      <Link
        to="/reports/in-process"
        className="group relative grid gap-1 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-sm transition-colors outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white lg:min-w-64"
      >
        <span className="flex items-center justify-between gap-6 text-sm text-white/75">
          Accounts under process
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
        <span className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">{show(data.inProcess)}</span>
        <span className="text-xs text-white/60">Pending accounts · view all</span>
      </Link>
    </header>
  )
}

/** Plain page heading for the layouts that do not open with the banner. */
export function DashboardHeading({ title, description }: { title: string; description: string }) {
  const user = useSessionUser()

  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <p className="text-xs font-semibold tracking-widest text-brand uppercase">Welcome, {user.empName}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild size="lg" className="h-10 px-4">
        <Link to="/journey">
          <Plus />
          Add New Account
        </Link>
      </Button>
    </header>
  )
}

export function CountsError({ data }: { data: DashboardData }) {
  if (!data.isError) return null
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
      Counts could not be loaded. The queues still open their screens.
    </p>
  )
}

/** One queue as a link: label, count and a bar scaled against the largest queue. */
export function QueueRow({ queue, max }: { queue: DashboardQueue; max: number }) {
  return (
    <Link to={queue.to} className={cn('group/row grid gap-1.5 rounded-lg px-2.5 py-2 hover:bg-muted', FOCUS)}>
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground group-hover/row:text-foreground">{queue.label}</span>
        <span className="text-base font-semibold tabular-nums">{show(queue.count)}</span>
      </span>
      <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted group-hover/row:bg-background">
        <span
          className="block h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${share(queue.count, max)}%` }}
        />
      </span>
    </Link>
  )
}

/** The busiest queues, ranked. */
export function AttentionList({ data, limit = 3 }: { data: DashboardData; limit?: number }) {
  const busiest = data.ranked.slice(0, limit)

  if (busiest.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        {data.loaded ? 'All queues are clear. Nothing is waiting right now.' : 'Queue counts are not available yet.'}
      </p>
    )
  }
  return (
    <ol className="grid gap-2">
      {busiest.map((queue, index) => (
        <li key={queue.countKey}>
          <Link
            to={queue.to}
            className={cn(
              'group flex items-center gap-4 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-muted/60',
              FOCUS,
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{queue.label}</span>
              <span className="text-xs text-muted-foreground">{queue.phase}</span>
            </span>
            <span className="text-2xl font-semibold tabular-nums">{queue.count}</span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </li>
      ))}
    </ol>
  )
}

export function QuickActions() {
  return (
    <ul className="grid gap-2">
      {SHORTCUTS.map(({ label, to, icon: Icon }, index) => (
        <li key={to}>
          <Link
            to={to}
            className={cn(
              'group flex items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors',
              FOCUS,
              index === 0
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:border-primary/40 hover:bg-muted/60',
            )}
          >
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-lg',
                index === 0 ? 'bg-primary-foreground/15' : 'bg-primary/10 text-primary',
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="flex-1">{label}</span>
            <ArrowRight className="size-4 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
