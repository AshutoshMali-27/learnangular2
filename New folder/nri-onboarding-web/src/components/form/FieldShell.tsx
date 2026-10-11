import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  /** Id of the control, or of the group label when `group` is set. */
  id: string
  label?: ReactNode
  required?: boolean
  description?: ReactNode
  error?: string
  /** Render the label as a group caption (radio / checkbox groups) instead of a <label>. */
  group?: boolean
  className?: string
  children: ReactNode
}

export const errorId = (id: string) => `${id}-error`

/** Label, required marker, help text and error message around one control. */
export function FieldShell({
  id,
  label,
  required,
  description,
  error,
  group,
  className,
  children,
}: FieldShellProps) {
  const caption = (
    <>
      {label}
      {required && (
        <span aria-hidden className="text-destructive">
          *
        </span>
      )}
    </>
  )

  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      {label &&
        (group ? (
          <span id={id} className="text-sm leading-none font-medium">
            {caption}
          </span>
        ) : (
          <Label htmlFor={id}>{caption}</Label>
        ))}
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && (
        <p id={errorId(id)} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
