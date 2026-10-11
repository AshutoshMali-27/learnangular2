import { Suspense, useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ObjectionBanner } from '@/components/shared/ObjectionBanner'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useJourney } from '@/features/journey/hooks/useJourney'
import { StageModeContext, type StageMode } from '@/features/journey/stageMode'
import { STAGES } from '@/features/journey/stages.config'
import { hasObjections, stageObjections, useFormObjections } from '../hooks/useObjections'
import { objectionPath } from './ObjectionHub'

/**
 * One stage reopened to correct objections: the same stage component as the journey, loaded
 * with its saved data, editable, with the objections shown above it. Saving returns to the hub.
 */
export default function ObjectionStagePage() {
  const { formNo = '', stageKey } = useParams()
  const journey = useJourney(formNo)
  const objections = useFormObjections(journey.data)
  const hub = objectionPath(formNo)
  const mode = useMemo<StageMode>(() => ({ isObjection: true, returnPath: hub }), [hub])

  if (journey.isPending || (journey.data?.skRefNo && objections.isPending)) return <PageLoader />

  const stage = STAGES.find((item) => item.key === stageKey)
  const current = stage && stageObjections(objections.data, stage.id)

  // Only stages with something to correct can be opened this way.
  if (!journey.data || !stage?.component || !current || !hasObjections(current)) {
    return <Navigate to={hub} replace />
  }

  const Stage = stage.component

  return (
    <div className="grid gap-4">
      <ObjectionBanner stageName={stage.title} remarks={current.remarks} objections={current.objections} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">
            <h1>
              {stage.title} <span className="font-normal text-muted-foreground">· Form {journey.data.formNo}</span>
            </h1>
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={hub}>Back to objections</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <StageModeContext.Provider value={mode}>
            <Suspense fallback={<PageLoader />}>
              <Stage key={`${formNo}:${stage.key}:objection`} journey={journey.data} readOnly={false} />
            </Suspense>
          </StageModeContext.Provider>
        </CardContent>
      </Card>
    </div>
  )
}
