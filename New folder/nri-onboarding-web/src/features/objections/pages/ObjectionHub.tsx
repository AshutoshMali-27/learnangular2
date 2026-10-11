import { CircleCheck, Trash2, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '@/api'
import { PageLoader } from '@/components/shared/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJourney } from '@/features/journey/hooks/useJourney'
import { STAGES } from '@/features/journey/stages.config'
import type { Journey } from '@/features/journey/types'
import { confirm } from '@/lib/dialog-service'
import { hasObjections, stageObjections, useCloseObjection, useFormObjections } from '../hooks/useObjections'
import type { FormObjections, ObjectionItem } from '../types'

export const objectionPath = (formNo: string, stageKey = '') =>
  `/objections/${encodeURIComponent(formNo)}${stageKey && `/${stageKey}`}`

function StageCard({ journey, objections }: { journey: Journey; objections: FormObjections }) {
  const close = useCloseObjection(journey)

  const remove = async (objection: ObjectionItem) => {
    const confirmed = await confirm({
      title: 'Remove objection?',
      description: `"${objection.text}" will be closed. Do this once the data has been corrected.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) close.mutate(objection.id)
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {STAGES.map((stage) => {
        const current = stageObjections(objections, stage.id)
        const raised = hasObjections(current)

        return (
          <li key={stage.key}>
            <Card className={raised ? 'h-full border-amber-500/50' : 'h-full opacity-70'}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">
                  <h2>{stage.title}</h2>
                </CardTitle>
                {raised ? (
                  <Badge variant="outline">
                    <TriangleAlert />
                    {current.objections.length > 0
                      ? `${current.objections.length} ${current.objections.length === 1 ? 'objection' : 'objections'}`
                      : 'Remark'}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <CircleCheck />
                    No objections
                  </Badge>
                )}
              </CardHeader>

              {raised && (
                <CardContent className="grid gap-3">
                  {current.remarks && (
                    <p className="text-sm">
                      <span className="font-medium">Remarks: </span>
                      <span className="text-muted-foreground">{current.remarks}</span>
                    </p>
                  )}
                  <ul className="grid gap-2">
                    {current.objections.map((objection) => (
                      <li key={objection.id} className="flex items-start justify-between gap-2 rounded-md bg-muted px-3 py-2 text-sm">
                        <span>{objection.text}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove objection: ${objection.text}`}
                          disabled={close.isPending}
                          onClick={() => remove(objection)}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <Button asChild size="sm">
                      <Link to={objectionPath(journey.formNo, stage.key)}>Correct {stage.title}</Link>
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

/** Objection correction hub: which stages have objections, with links to fix and close them. */
export default function ObjectionHub() {
  const { formNo = '' } = useParams()
  const journey = useJourney(formNo)
  const objections = useFormObjections(journey.data)

  if (journey.isPending || (journey.data?.skRefNo && objections.isPending)) {
    return <PageLoader label="Loading objections…" />
  }

  const error = journey.error ?? objections.error
  if (error || !journey.data) {
    return (
      <section className="grid justify-items-start gap-3">
        <h1 className="text-xl font-semibold">Objections for {formNo} cannot be opened</h1>
        <p className="text-sm text-muted-foreground">{error ? getErrorMessage(error) : 'Form not found.'}</p>
        <Button asChild variant="outline">
          <Link to="/objections">Back to Data Objection</Link>
        </Button>
      </section>
    )
  }

  const all = objections.data ?? {}
  const pending = STAGES.filter((stage) => hasObjections(stageObjections(all, stage.id)))

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <h1 className="text-xl font-semibold">Objection Correction</h1>
          <dl className="flex flex-wrap gap-x-6 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt>Form No</dt>
              <dd className="font-medium text-foreground">{journey.data.formNo}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt>Reference No</dt>
              <dd className="font-medium text-foreground">{journey.data.skRefNo ?? '—'}</dd>
            </div>
          </dl>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/objections">Back to Data Objection</Link>
        </Button>
      </header>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="grid justify-items-center gap-3 py-10 text-center">
            <CircleCheck className="size-12 text-primary" />
            <h2 className="text-lg font-semibold">All objections closed</h2>
            <p className="text-sm text-muted-foreground">Nothing is pending on this form.</p>
            <Button asChild>
              <Link to="/">Go to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p
            role="status"
            className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium"
          >
            <TriangleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            Objections pending on {pending.length} {pending.length === 1 ? 'stage' : 'stages'}:{' '}
            {pending.map((stage) => stage.title).join(', ')}
          </p>
          <StageCard journey={journey.data} objections={all} />
        </>
      )}
    </div>
  )
}
