import { useFormContext, useWatch } from 'react-hook-form'
import { TextField, VerifiableField, type VerifyResult } from '@/components/form'
import { PersonNameFields } from '@/components/shared/PersonNameFields'
import { splitFullName } from '@/lib/names'
import { filters, isValidPan } from '@/lib/validators'
import { journeyService } from '../../../services'
import type { PanDetails } from '../../../types'
import { useStageMode } from '../../../stageMode'
import { ageFromDob, MINIMUM_AGE, prefixDefaults } from '../rules'
import { INWARD_DEFAULTS, type InwardValues } from '../schema'

const verifyPan = async (pan: string): Promise<VerifyResult<PanDetails>> => {
  const details = await journeyService.checkPan(pan)
  if (ageFromDob(details.dob) < MINIMUM_AGE) {
    return {
      valid: false,
      message: `Account opening is not permitted for users below ${MINIMUM_AGE} years.`,
    }
  }
  return { valid: true, data: details }
}

export function PanIdentityStep() {
  const { setValue, reset, control } = useFormContext<InwardValues>()
  const nameAsPerPan = useWatch({ control, name: 'nameAsPerPan' })
  const { isObjection } = useStageMode()

  const handleVerified = (_pan: string, details: PanDetails | undefined) => {
    if (!details) return
    const name = splitFullName(details.nameAsPerPan)
    setValue('dob', details.dob, { shouldValidate: true })
    setValue('nameAsPerPan', details.nameAsPerPan)
    setValue('panAadhaarSeeding', details.seedingStatus)
    setValue('name.firstName', name.firstName, { shouldValidate: true })
    setValue('name.middleName', name.middleName)
    setValue('name.lastName', name.lastName)
  }

  const handlePrefixChange = (prefix: string) => {
    // A new title replaces whatever the previous one implied.
    const defaults = prefixDefaults(prefix)
    setValue('gender', defaults.gender ?? '')
    setValue('maritalStatus', defaults.maritalStatus ?? '')
    setValue('fatherOrSpouse', defaults.fatherOrSpouse ?? '')
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <VerifiableField<PanDetails>
          name="pan"
          statusName="panStatus"
          label="PAN Number"
          required
          maxLength={10}
          transform={filters.upperAlnum}
          canVerify={isValidPan}
          onVerify={verifyPan}
          onVerified={handleVerified}
          // Everything on the form hangs off the PAN, so resetting it starts the stage over.
          onReset={() => reset(INWARD_DEFAULTS)}
          // The application already exists under this PAN, so it cannot be swapped while correcting.
          resettable={!isObjection}
          description="Individual PAN only (4th character P)"
        />
        <TextField name="dob" label="Date of Birth" required readOnly description="Filled from the PAN" />
      </div>

      {nameAsPerPan && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Name as per PAN: </span>
          <span className="font-medium">{nameAsPerPan}</span>
        </p>
      )}

      <PersonNameFields name="name" required onPrefixChange={handlePrefixChange} />
    </div>
  )
}
