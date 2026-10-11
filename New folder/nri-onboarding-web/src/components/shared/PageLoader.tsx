import { Loader2 } from 'lucide-react'

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-40 place-items-center text-muted-foreground">
      <span className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        {label}
      </span>
    </div>
  )
}
