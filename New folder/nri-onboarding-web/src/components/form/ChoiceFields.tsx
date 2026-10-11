import { useId } from 'react'
import { useController } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { errorId, FieldShell } from './FieldShell'
import type { BaseFieldProps, Option } from './types'

interface ChoiceGroupProps extends BaseFieldProps {
  options: Option[]
  orientation?: 'horizontal' | 'vertical'
}

const groupLayout = (orientation: ChoiceGroupProps['orientation']) =>
  orientation === 'vertical' ? 'grid gap-2' : 'flex flex-wrap gap-x-5 gap-y-2'

export interface RadioGroupFieldProps extends ChoiceGroupProps {
  onValueChange?: (value: string) => void
}

/** Single choice from a short list (gender, marital status, contract note…). */
export function RadioGroupField({
  name,
  label,
  required,
  description,
  disabled,
  className,
  options,
  orientation = 'horizontal',
  onValueChange,
}: RadioGroupFieldProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })

  return (
    <FieldShell
      id={id}
      group
      label={label}
      required={required}
      description={description}
      error={fieldState.error?.message}
      className={className}
    >
      <RadioGroup
        ref={field.ref}
        name={field.name}
        value={field.value ?? ''}
        disabled={disabled}
        onValueChange={(value) => {
          field.onChange(value)
          onValueChange?.(value)
        }}
        onBlur={field.onBlur}
        aria-labelledby={id}
        aria-required={required}
        aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? errorId(id) : undefined}
        className={groupLayout(orientation)}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem id={optionId} value={option.value} disabled={option.disabled} />
              <Label htmlFor={optionId} className="font-normal">
                {option.label}
              </Label>
            </div>
          )
        })}
      </RadioGroup>
    </FieldShell>
  )
}

const YES_NO: Option[] = [
  { value: 'Y', label: 'Yes' },
  { value: 'N', label: 'No' },
]

/** Yes / No answer stored as the backend's `Y` / `N` flag. */
export function YesNoField(props: Omit<RadioGroupFieldProps, 'options' | 'orientation'>) {
  return <RadioGroupField {...props} options={YES_NO} />
}

export interface CheckboxGroupFieldProps extends ChoiceGroupProps {
  onValueChange?: (value: string[]) => void
}

/** Multiple choice stored as an array of option values (NRI types, proof categories…). */
export function CheckboxGroupField({
  name,
  label,
  required,
  description,
  disabled,
  className,
  options,
  orientation = 'horizontal',
  onValueChange,
}: CheckboxGroupFieldProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })
  const selected: string[] = field.value ?? []

  const toggle = (value: string, checked: boolean) => {
    const next = checked ? [...selected, value] : selected.filter((item) => item !== value)
    field.onChange(next)
    onValueChange?.(next)
  }

  return (
    <FieldShell
      id={id}
      group
      label={label}
      required={required}
      description={description}
      error={fieldState.error?.message}
      className={className}
    >
      <div
        role="group"
        aria-labelledby={id}
        aria-describedby={fieldState.error ? errorId(id) : undefined}
        className={groupLayout(orientation)}
      >
        {options.map((option, index) => {
          const optionId = `${id}-${option.value}`
          return (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={optionId}
                ref={index === 0 ? field.ref : undefined}
                checked={selected.includes(option.value)}
                disabled={disabled || option.disabled}
                onCheckedChange={(checked) => toggle(option.value, checked === true)}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
              />
              <Label htmlFor={optionId} className="font-normal">
                {option.label}
              </Label>
            </div>
          )
        })}
      </div>
    </FieldShell>
  )
}

export interface CheckboxFieldProps extends Omit<BaseFieldProps, 'required'> {
  onValueChange?: (checked: boolean) => void
}

/** Single boolean checkbox with its label on the right ("Same as permanent address"). */
export function CheckboxField({
  name,
  label,
  description,
  disabled,
  className,
  onValueChange,
}: CheckboxFieldProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })

  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          ref={field.ref}
          checked={field.value === true}
          disabled={disabled}
          onCheckedChange={(checked) => {
            field.onChange(checked === true)
            onValueChange?.(checked === true)
          }}
          onBlur={field.onBlur}
          aria-invalid={fieldState.invalid}
        />
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {fieldState.error && (
        <p role="alert" className="text-xs text-destructive">
          {fieldState.error.message}
        </p>
      )}
    </div>
  )
}
