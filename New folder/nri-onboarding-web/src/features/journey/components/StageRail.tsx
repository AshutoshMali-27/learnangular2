import { Check, Lock, Minus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getStageCounts, journeyPath, STAGES, type StageStatus } from '../stages.config'
import type { Journey } from '../types'

const STATUS_TEXT: Record<StageStatus, string> = {
  completed: 'Completed',
  current: 'In progress',
  pending: 'Pending',
  skipped: 'Not required',
}

function Marker({ status, index }: { status: StageStatus; index: number }) {
  return (
    <span
      className={cn(
        'relative z-10 grid size-7 shrink-0 place-items-center rounded-full border bg-card text-xs font-semibold text-muted-foreground',
        status === 'completed' && 'border-primary bg-primary text-primary-foreground',
        status === 'current' && 'border-brand text-brand ring-4 ring-brand/15',
      )}
    >
      {status === 'completed' ? (
        <Check className="size-4" />
      ) : status === 'pending' ? (
        <Lock className="size-3.5" />
      ) : status === 'skipped' ? (
        <Minus className="size-4" />
      ) : (
        index + 1
      )}
    </span>
  )
}

/** Always-visible list of stages. Completed and current stages are links; later ones are locked. */
export function StageRail({ journey }: { journey: Journey }) {
  const { formNo, progress } = journey
  const { statuses, required, done, percent } = getStageCounts(progress)

  return (
    <nav
      aria-label="Journey stages"
      className="scrollbar-slim grid content-start gap-3 self-start rounded-xl border bg-card p-3 shadow-xs lg:sticky lg:top-0 lg:max-h-[calc(100svh-8.5rem)] lg:overflow-y-auto lg:p-4"
    >
      <div className="grid gap-2">
        <p className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold">Your progress</span>
          <span className="text-muted-foreground">
            {done} of {required} stages
          </span>
        </p>
        <Progress value={percent} className="h-1.5" aria-label="Journey progress" />
      </div>

      <ol className="scrollbar-slim flex gap-1 overflow-x-auto pb-1 lg:grid lg:gap-0 lg:overflow-visible lg:pb-0">
        {STAGES.map((stage, index) => {
          const status = statuses[index]
          const body = (
            <>
              <Marker status={status} index={index} />
              <span className="grid text-left leading-tight">
                <span className="text-sm whitespace-nowrap">{stage.title}</span>
                <span
                  className={cn(
                    'text-xs text-muted-foreground',
                    status === 'current' && 'font-medium text-brand',
                    status === 'completed' && 'text-success',
                  )}
                >
                  {STATUS_TEXT[status]}
                </span>
              </span>
            </>
          )
          const layout = 'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors'

          return (
            <li key={stage.key} className="relative shrink-0">
              {/* Connector to the next stage (vertical layout only). */}
              {index < STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-10 left-[1.625rem] hidden h-[calc(100%-1.75rem)] w-px -translate-x-1/2 bg-border lg:block',
                    status === 'completed' && 'bg-primary',
                  )}
                />
              )}
              {status === 'completed' || status === 'current' ? (
                <NavLink
                  to={journeyPath(formNo, stage.key)}
                  className={({ isActive }) =>
                    cn(layout, 'hover:bg-muted', isActive && 'bg-primary/8 font-medium hover:bg-primary/10')
                  }
                >
                  {body}
                </NavLink>
              ) : (
                <span className={cn(layout, 'opacity-60')} aria-disabled>
                  {body}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
