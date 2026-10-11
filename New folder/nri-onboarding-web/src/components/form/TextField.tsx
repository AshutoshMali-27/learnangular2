import { useId, type ComponentProps } from 'react'
import { useController } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { errorId, FieldShell } from './FieldShell'
import type { BaseFieldProps } from './types'

export interface TextFieldProps
  extends BaseFieldProps,
    Omit<ComponentProps<typeof Input>, 'name' | 'value' | 'onChange' | 'className'> {
  /** Filters what the user can type or paste, e.g. `filters.digits`. */
  transform?: (value: string) => string
  /** Runs after the value changes; use it for dependent defaults instead of an effect. */
  onValueChange?: (value: string) => void
}

export function TextField({
  name,
  label,
  required,
  description,
  className,
  transform,
  onValueChange,
  ...inputProps
}: TextFieldProps) {
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
      <Input
        {...inputProps}
        id={id}
        ref={field.ref}
        name={field.name}
        value={field.value ?? ''}
        onBlur={field.onBlur}
        onChange={(event) => {
          const value = transform ? transform(event.target.value) : event.target.value
          field.onChange(value)
          onValueChange?.(value)
        }}
        aria-invalid={fieldState.invalid}
        aria-required={required}
        aria-describedby={fieldState.error ? errorId(id) : undefined}
      />
    </FieldShell>
  )
}

/** Native date input bound to a `yyyy-MM-dd` string. */
export function DateField(props: Omit<TextFieldProps, 'type' | 'transform'>) {
  return <TextField {...props} type="date" />
}
