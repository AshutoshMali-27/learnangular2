import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { get, useFormContext, type FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  /** Form paths validated before leaving this step. Omit for display-only steps. */
  fields?: string[]
  content: ReactNode
}

interface StageWizardProps {
  steps: WizardStep[]
  /** Zero-based current step. Controlled, so the position can live in the drafts slice. */
  step: number
  onStepChange: (step: number) => void
  /** Called on the last step after the whole form validates. */
  onSubmit: () => void
  isSubmitting?: boolean
  submitLabel?: string
  /** View mode: free navigation between steps, no Save. */
  readOnly?: boolean
}

/**
 * Multi-step form body: step header, progress, Previous / Next / Save. Must be rendered
 * inside a <FormProvider>. Next validates only the current step's fields.
 */
export function StageWizard({
  steps,
  step,
  onStepChange,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
  readOnly,
}: StageWizardProps) {
  const { trigger, handleSubmit } = useFormContext()
  const current = Math.min(Math.max(step, 0), steps.length - 1)
  const isLast = current === steps.length - 1

  const goNext = async () => {
    const fields = steps[current].fields
    const valid = readOnly || !fields || (await trigger(fields, { shouldFocus: true }))
    if (valid) onStepChange(current + 1)
  }

  // Save validates the whole form; an error on an earlier step would otherwise be invisible.
  const showFirstInvalidStep = (errors: FieldErrors) => {
    const index = steps.findIndex((item) => item.fields?.some((field) => get(errors, field)))
    if (index >= 0 && index !== current) onStepChange(index)
    toast.error('Some details need attention before saving.')
  }

  const submit = (event: FormEvent) => {
    // A wizard inside a dialog must not submit the stage form it was opened from.
    event.stopPropagation()
    // Enter on an earlier step advances instead of saving.
    if (!isLast) {
      event.preventDefault()
      void goNext()
      return
    }
    void handleSubmit(onSubmit, showFirstInvalidStep)(event)
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <div className="grid gap-3">
        <ol className="flex flex-wrap gap-2">
          {steps.map((item, index) => {
            const done = index < current
            const canJump = readOnly || done
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!canJump}
                  onClick={() => onStepChange(index)}
                  aria-current={index === current ? 'step' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-full border bg-card py-1 pr-3.5 pl-1 text-sm text-muted-foreground transition-colors',
                    index === current && 'border-primary bg-primary font-medium text-primary-foreground',
                    done && 'border-primary/25 bg-primary/8 text-primary',
                    canJump && index !== current && 'hover:border-primary/50 hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold',
                      index === current && 'bg-primary-foreground text-primary',
                      done && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  {item.title}
                </button>
              </li>
            )
          })}
        </ol>
        <Progress
          value={((current + 1) / steps.length) * 100}
          aria-label={`Step ${current + 1} of ${steps.length}`}
        />
      </div>

      <fieldset disabled={readOnly} className="min-w-0">
        <legend className="mb-4 flex items-center gap-2 text-base font-semibold">
          <span aria-hidden className="h-5 w-1 rounded-full bg-brand" />
          {steps[current].title}
        </legend>
        {steps[current].content}
      </fieldset>

      <div className="flex justify-between gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className={cn('px-4', current === 0 && 'invisible')}
          onClick={() => onStepChange(current - 1)}
          disabled={isSubmitting}
        >
          <ChevronLeft />
          Previous
        </Button>
        {!isLast ? (
          <Button type="button" size="lg" className="px-4" onClick={goNext}>
            Next
            <ChevronRight />
          </Button>
        ) : (
          !readOnly && (
            <Button type="submit" size="lg" className="px-4" disabled={isSubmitting}>
              <Check />
              {isSubmitting ? 'Saving…' : submitLabel}
            </Button>
          )
        )}
      </div>
    </form>
  )
}
