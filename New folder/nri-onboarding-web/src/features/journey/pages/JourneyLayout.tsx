import { FileText, Hash } from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { StageRail } from '../components/StageRail'
import { useJourney } from '../hooks/useJourney'
import { getStageCounts } from '../stages.config'
import type { Journey } from '../types'

/** Shell of one form's journey: header, stage rail and the active stage. */
export default function JourneyLayout() {
  const { formNo = '' } = useParams()
  const { data: journey, isPending, isError, error } = useJourney(formNo)

  if (isPending) return <PageLoader label="Loading form…" />

  if (isError) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl border bg-card p-6 shadow-xs">
        <h1 className="text-xl font-semibold tracking-tight">Form {formNo} cannot be opened</h1>
        <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
        <Button asChild variant="outline">
          <Link to="/journey">Enter another form number</Link>
        </Button>
      </section>
    )
  }

  const { percent } = getStageCounts(journey.progress)
  const chip = 'flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 ring-1 ring-white/15'

  return (
    <div className="grid gap-4 lg:gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-hero p-5 shadow-sm sm:p-6">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-xs font-medium tracking-widest text-white/70 uppercase">Onboarding journey</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">NRI Account Opening</h1>
          </div>
          <dl className="flex flex-wrap gap-2 text-sm">
            <div className={chip}>
              <FileText className="size-4 text-white/70" />
              <dt className="text-white/70">Form No</dt>
              <dd className="font-semibold">{journey.formNo}</dd>
            </div>
            {journey.skRefNo && (
              <div className={chip}>
                <Hash className="size-4 text-white/70" />
                <dt className="text-white/70">Reference No</dt>
                <dd className="font-semibold">{journey.skRefNo}</dd>
              </div>
            )}
          </dl>
        </div>
        <p className="grid justify-items-end leading-none">
          <span className="text-4xl font-semibold tabular-nums">{percent}%</span>
          <span className="mt-1 text-xs text-white/70">completed</span>
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-6">
        <StageRail journey={journey} />
        <div className="min-w-0">
          <Suspense fallback={<PageLoader />}>
            <Outlet context={journey satisfies Journey} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

/** The journey loaded by <JourneyLayout />, for its child routes. */
export const useJourneyContext = () => useOutletContext<Journey>()
