import { useId } from 'react'
import { useController } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { errorId, FieldShell } from './FieldShell'
import type { BaseFieldProps, Option } from './types'

export interface SelectFieldProps extends BaseFieldProps {
  options: Option[] | undefined
  placeholder?: string
  isLoading?: boolean
  onValueChange?: (value: string) => void
}

export function SelectField({
  name,
  label,
  required,
  description,
  disabled,
  className,
  options,
  placeholder = 'Select',
  isLoading,
  onValueChange,
}: SelectFieldProps) {
  const id = useId()
  const { field, fieldState } = useController({ name })

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={description}
      error={fieldState.error?.message}
      className={className}
    >
      <Select
        name={field.name}
        value={field.value ?? ''}
        disabled={disabled || isLoading}
        onValueChange={(value) => {
          field.onChange(value)
          onValueChange?.(value)
        }}
      >
        <SelectTrigger
          id={id}
          ref={field.ref}
          onBlur={field.onBlur}
          className="w-full"
          aria-invalid={fieldState.invalid}
          aria-required={required}
          aria-describedby={fieldState.error ? errorId(id) : undefined}
        >
          <SelectValue placeholder={isLoading ? 'Loading…' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
