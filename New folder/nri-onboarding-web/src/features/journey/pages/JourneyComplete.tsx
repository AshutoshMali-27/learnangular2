import { CircleCheck } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { currentStagePath, getCurrentStage } from '../stages.config'
import { useJourneyContext } from './JourneyLayout'

export default function JourneyComplete() {
  const journey = useJourneyContext()
  // Reachable only once every required stage is saved.
  if (getCurrentStage(journey.progress)) {
    return <Navigate to={currentStagePath(journey.formNo, journey.progress)} replace />
  }
  return (
    <Card>
      <CardContent className="grid justify-items-center gap-3 py-12 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-success/10 ring-8 ring-success/5">
          <CircleCheck className="size-10 text-success" />
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Form submitted successfully</h2>
        <p className="text-sm text-muted-foreground">
          Form No <span className="font-medium text-foreground">{journey.formNo}</span>
          {journey.skRefNo && (
            <>
              {' · '}Reference No{' '}
              <span className="font-medium text-foreground">{journey.skRefNo}</span>
            </>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button asChild>
            <Link to="/journey">Start another form</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
