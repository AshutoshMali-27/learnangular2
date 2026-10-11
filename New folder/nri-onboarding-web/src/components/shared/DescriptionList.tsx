import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface DescriptionItem {
  label: string
  value: ReactNode
}

interface DescriptionListProps {
  items: DescriptionItem[]
  className?: string
}

/** Read-only label / value grid for view mode and the account status report. */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="grid gap-0.5">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-sm break-words">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
