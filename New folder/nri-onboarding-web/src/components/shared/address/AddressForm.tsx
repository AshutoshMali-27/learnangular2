import { useFormContext, useWatch } from 'react-hook-form'
import { SelectField, TextField } from '@/components/form'
import { FOREIGN_PINCODE, INDIA_COUNTRY_ID, useCities, useCountries, useStates } from '@/features/masters'
import { filters } from '@/lib/validators'
import { ADDRESS_LINE_MAX, ADDRESS_SHORT_MAX } from './address.schema'

interface AddressFormProps {
  /** Form path of the address object, e.g. `permanent` or `holders.0.correspondence`. */
  name: string
  disabled?: boolean
  /** Leaves out Landmark and District, which nominee and guardian addresses do not capture. */
  compact?: boolean
}

/**
 * One address block with the Country → State → City cascade. Used for permanent and
 * correspondence addresses of the client, joint holders, nominees and guardians.
 */
export function AddressForm({ name, disabled, compact }: AddressFormProps) {
  const { setValue } = useFormContext()
  const path = (key: string) => `${name}.${key}`

  const countryId: string = useWatch({ name: path('countryId') }) ?? ''
  const stateId: string = useWatch({ name: path('stateId') }) ?? ''
  const countries = useCountries()
  const states = useStates(countryId)
  const cities = useCities(stateId)
  const isForeign = !!countryId && countryId !== INDIA_COUNTRY_ID

  const handleCountryChange = (nextCountryId: string) => {
    setValue(path('stateId'), '')
    setValue(path('cityId'), '')
    setValue(path('pincode'), nextCountryId === INDIA_COUNTRY_ID ? '' : FOREIGN_PINCODE, {
      shouldValidate: true,
    })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TextField
        name={path('line1')}
        label="Address Line 1"
        required
        maxLength={ADDRESS_LINE_MAX}
        transform={filters.addressLine}
        disabled={disabled}
        autoComplete="address-line1"
      />
      <TextField
        name={path('line2')}
        label="Address Line 2"
        maxLength={ADDRESS_LINE_MAX}
        transform={filters.addressLine}
        disabled={disabled}
        autoComplete="address-line2"
      />
      <TextField
        name={path('line3')}
        label="Address Line 3"
        maxLength={ADDRESS_LINE_MAX}
        transform={filters.addressLine}
        disabled={disabled}
        autoComplete="address-line3"
      />
      {!compact && (
        <TextField
          name={path('landmark')}
          label="Landmark"
          maxLength={ADDRESS_SHORT_MAX}
          transform={filters.addressLine}
          disabled={disabled}
        />
      )}
      <SelectField
        name={path('countryId')}
        label="Country"
        required
        options={countries.data}
        isLoading={countries.isPending}
        disabled={disabled}
        onValueChange={handleCountryChange}
      />
      <SelectField
        name={path('stateId')}
        label="State"
        required
        options={states.data}
        isLoading={states.isFetching}
        disabled={disabled || !countryId}
        placeholder={countryId ? 'Select' : 'Select a country first'}
        onValueChange={() => setValue(path('cityId'), '')}
      />
      <SelectField
        name={path('cityId')}
        label="City"
        required
        options={cities.data}
        isLoading={cities.isFetching}
        disabled={disabled || !stateId}
        placeholder={stateId ? 'Select' : 'Select a state first'}
      />
      {!compact && (
        <TextField
          name={path('district')}
          label="District"
          maxLength={ADDRESS_SHORT_MAX}
          transform={filters.personName}
          disabled={disabled}
        />
      )}
      <TextField
        name={path('pincode')}
        label="Pincode"
        required
        inputMode="numeric"
        maxLength={6}
        transform={filters.digits}
        disabled={disabled}
        readOnly={isForeign}
        description={isForeign ? 'Fixed for addresses outside India' : undefined}
        autoComplete="postal-code"
      />
    </div>
  )
}
