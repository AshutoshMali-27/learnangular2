import { CircleCheck } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import { PendingPage } from '@/components/shared/PendingPage'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { currentStagePath, getStageStatus, STAGES } from '../stages.config'
import { useJourneyContext } from './JourneyLayout'

/**
 * Route guard and host for one stage. A stage that is not reachable yet redirects to the
 * current one; a completed stage opens read-only.
 */
export default function StagePage() {
  const { stageKey } = useParams()
  const journey = useJourneyContext()
  const stage = STAGES.find((item) => item.key === stageKey)
  const status = stage && getStageStatus(stage, journey.progress)

  if (!stage || status === 'pending' || status === 'skipped') {
    return <Navigate to={currentStagePath(journey.formNo, journey.progress)} replace />
  }

  const Stage = stage.component
  const readOnly = status === 'completed'

  return (
    <Card className="[--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(6)]">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b">
        <div className="grid gap-0.5">
          <p className="text-xs font-semibold tracking-widest text-brand uppercase">
            Stage {STAGES.indexOf(stage) + 1} of {STAGES.length}
          </p>
          <CardTitle className="text-xl tracking-tight">
            <h2>{stage.title}</h2>
          </CardTitle>
        </div>
        {readOnly && (
          <Badge variant="secondary" className="h-6 px-2.5">
            <CircleCheck />
            Completed · view only
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {Stage ? (
          // Keyed so moving between stages never carries one stage's form state into another.
          <Stage key={`${journey.formNo}:${stage.key}`} journey={journey} readOnly={readOnly} />
        ) : (
          <PendingPage title={`${stage.title} stage`} phase={stage.phase} />
        )}
      </CardContent>
    </Card>
  )
}

/** `/journey/:formNo` with no stage: send the user to where the form currently stands. */
export function JourneyIndex() {
  const journey = useJourneyContext()
  return <Navigate to={currentStagePath(journey.formNo, journey.progress)} replace />
}
