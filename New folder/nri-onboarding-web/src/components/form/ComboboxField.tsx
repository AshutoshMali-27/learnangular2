import { Check, ChevronsUpDown } from 'lucide-react'
import { useId, useState } from 'react'
import { useController } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { errorId, FieldShell } from './FieldShell'
import type { SelectFieldProps } from './SelectField'

export interface ComboboxFieldProps extends SelectFieldProps {
  searchPlaceholder?: string
  emptyText?: string
  /** Lets the user clear the selection by picking the selected option again. */
  clearable?: boolean
}

/** Searchable select for long masters (branches, nationalities, brokerage schemes). */
export function ComboboxField({
  name,
  label,
  required,
  description,
  disabled,
  className,
  options,
  placeholder = 'Select',
  searchPlaceholder = 'Search…',
  emptyText = 'No match found.',
  isLoading,
  clearable,
  onValueChange,
}: ComboboxFieldProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const { field, fieldState } = useController({ name })
  const selected = options?.find((option) => option.value === field.value)

  const select = (value: string) => {
    const next = clearable && value === field.value ? '' : value
    field.onChange(next)
    onValueChange?.(next)
    setOpen(false)
  }

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      description={description}
      error={fieldState.error?.message}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            ref={field.ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={fieldState.invalid}
            aria-required={required}
            aria-describedby={fieldState.error ? errorId(id) : undefined}
            disabled={disabled || isLoading}
            onBlur={field.onBlur}
            className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground')}
          >
            <span className="truncate">
              {isLoading ? 'Loading…' : (selected?.label ?? placeholder)}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options?.map((option) => (
                  <CommandItem
                    key={option.value}
                    // cmdk filters on `value`, so search by what the user sees.
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => select(option.value)}
                  >
                    {option.label}
                    <Check
                      className={cn('ml-auto', option.value !== field.value && 'opacity-0')}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldShell>
  )
}
