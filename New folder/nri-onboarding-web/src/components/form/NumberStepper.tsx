import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'
import { useController } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorId, FieldShell } from './FieldShell'
import type { BaseFieldProps } from './types'

export interface NumberStepperProps extends BaseFieldProps {
  min?: number
  max?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** Whole-number field with − / + buttons (years of experience). */
export function NumberStepper({
  name,
  label,
  required,
  description,
  disabled,
  className,
  min = 0,
  max = 99,
}: NumberStepperProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })
  const value = Number(field.value) || 0
  const set = (next: number) => field.onChange(clamp(next, min, max))

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={description}
      error={fieldState.error?.message}
      className={className}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease"
          disabled={disabled || value <= min}
          onClick={() => set(value - 1)}
        >
          <Minus />
        </Button>
        <Input
          id={id}
          ref={field.ref}
          name={field.name}
          inputMode="numeric"
          className="w-16 text-center"
          value={value}
          disabled={disabled}
          onBlur={field.onBlur}
          onChange={(event) => set(Number(event.target.value.replace(/\D/g, '')))}
          aria-invalid={fieldState.invalid}
          aria-describedby={fieldState.error ? errorId(id) : undefined}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase"
          disabled={disabled || value >= max}
          onClick={() => set(value + 1)}
        >
          <Plus />
        </Button>
      </div>
    </FieldShell>
  )
}
