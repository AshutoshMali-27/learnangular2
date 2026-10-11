import { SelectField, TextField } from '@/components/form'
import { NAME_PREFIXES } from '@/features/masters'
import { filters } from '@/lib/validators'

interface PersonNameFieldsProps {
  /** Form path of the name object holding `prefix`, `firstName`, `middleName`, `lastName`. */
  name: string
  /** Prepended to each label, e.g. "Father" → "Father First Name". */
  labelPrefix?: string
  withPrefix?: boolean
  required?: boolean
  maxLength?: number
  disabled?: boolean
  /** Runs when the title changes; stages use it to default gender / marital status. */
  onPrefixChange?: (prefix: string) => void
}

/** Title + first / middle / last name, used for the client, holders, parents, nominees. */
export function PersonNameFields({
  name,
  labelPrefix,
  withPrefix = true,
  required,
  maxLength = 30,
  disabled,
  onPrefixChange,
}: PersonNameFieldsProps) {
  const label = (text: string) => (labelPrefix ? `${labelPrefix} ${text}` : text)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {withPrefix && (
        <SelectField
          name={`${name}.prefix`}
          label={label('Prefix')}
          required={required}
          options={NAME_PREFIXES}
          disabled={disabled}
          onValueChange={onPrefixChange}
        />
      )}
      <TextField
        name={`${name}.firstName`}
        label={label('First Name')}
        required={required}
        maxLength={maxLength}
        transform={filters.personName}
        disabled={disabled}
      />
      <TextField
        name={`${name}.middleName`}
        label={label('Middle Name')}
        maxLength={maxLength}
        transform={filters.personName}
        disabled={disabled}
      />
      <TextField
        name={`${name}.lastName`}
        label={label('Last Name')}
        maxLength={maxLength}
        transform={filters.personName}
        disabled={disabled}
      />
    </div>
  )
}
