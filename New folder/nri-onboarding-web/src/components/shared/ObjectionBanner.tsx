import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export interface Objection {
  id: string
  text: string
}

interface ObjectionBannerProps {
  stageName: string
  remarks?: string
  objections: Objection[]
}

/** Shown at the top of a stage opened to correct scrutiny objections. Renders nothing otherwise. */
export function ObjectionBanner({ stageName, remarks, objections }: ObjectionBannerProps) {
  if (objections.length === 0 && !remarks) return null

  const count = objections.length
  const summary =
    count > 0
      ? `${count} ${count === 1 ? 'objection needs' : 'objections need'} your attention`
      : 'Scrutiny left a remark on this stage'

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
    >
      <TriangleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="flex-1 font-medium">{summary}</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stageName} objections</DialogTitle>
            <DialogDescription>Correct these points, then save the stage.</DialogDescription>
          </DialogHeader>
          {remarks && (
            <div className="grid gap-1 text-sm">
              <p className="font-medium">Remarks</p>
              <p className="text-muted-foreground">{remarks}</p>
            </div>
          )}
          {count > 0 && (
            <ol className="grid list-decimal gap-2 pl-5 text-sm">
              {objections.map((objection) => (
                <li key={objection.id}>{objection.text}</li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
