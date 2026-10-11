import { useFormContext, useWatch } from 'react-hook-form'
import { RadioGroupField } from '@/components/form'
import { PersonNameFields } from '@/components/shared/PersonNameFields'
import { GENDERS, MARITAL_STATUSES } from '@/features/masters'
import {
  FATHER_SPOUSE_OPTIONS,
  isResidentialStatusAllowed,
  NRI_WITH_OPTIONS,
  residentialStatusOptions,
} from '../rules'
import type { InwardValues } from '../schema'

export function PersonalStep() {
  const { setValue, getValues, control } = useFormContext<InwardValues>()
  const nriWith = useWatch({ control, name: 'nriWith' })
  const fatherOrSpouse = useWatch({ control, name: 'fatherOrSpouse' })

  const handleNriWithChange = (next: string) => {
    if (!isResidentialStatusAllowed(getValues('residentialStatus'), next)) {
      setValue('residentialStatus', '', { shouldValidate: true })
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <RadioGroupField
          name="nriWith"
          label="NRI With"
          required
          options={NRI_WITH_OPTIONS}
          onValueChange={handleNriWithChange}
        />
        <RadioGroupField
          name="residentialStatus"
          label="Residential Status"
          required
          options={residentialStatusOptions(nriWith)}
          description="Resident Individual is available only for Mariner"
        />
        <RadioGroupField
          name="gender"
          label="Gender"
          required
          options={GENDERS}
          onValueChange={(gender) => {
            if (gender === 'M') setValue('fatherOrSpouse', 'F', { shouldValidate: true })
          }}
        />
        <RadioGroupField name="maritalStatus" label="Marital Status" required options={MARITAL_STATUSES} />
        <RadioGroupField
          name="fatherOrSpouse"
          label="Father / Spouse"
          required
          options={FATHER_SPOUSE_OPTIONS}
        />
      </div>

      <PersonNameFields
        name="fatherSpouseName"
        labelPrefix={fatherOrSpouse === 'H' ? 'Spouse' : fatherOrSpouse === 'F' ? 'Father' : 'Father / Spouse'}
        withPrefix={false}
        required
      />
    </div>
  )
}
