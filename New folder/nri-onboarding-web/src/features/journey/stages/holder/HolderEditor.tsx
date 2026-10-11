import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { CheckboxField, RadioGroupField, TextField, VerifiableField, type VerifyResult } from '@/components/form'
import { AddressForm } from '@/components/shared/address/AddressForm'
import { PersonNameFields } from '@/components/shared/PersonNameFields'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { useSessionUser } from '@/features/auth'
import { GENDERS, MARITAL_STATUSES, RESIDENTIAL_STATUSES } from '@/features/masters'
import { splitFullName } from '@/lib/names'
import { filters, isValidPan } from '@/lib/validators'
import { ContactVerifyFields } from '../../components/ContactVerifyFields'
import { useEditorStep } from '../../hooks/useRecordList'
import { journeyService } from '../../services'
import type { Journey, PanDetails } from '../../types'
import { FATHER_SPOUSE_OPTIONS, prefixDefaults } from '../inward/rules'
import { HOLDER_DEFAULTS, HOLDER_STEP_FIELDS, holderSchema, type HolderRecord } from './schema'

interface HolderEditorProps {
  journey: Journey
  editorStage: string
  /** The holder being edited; omitted when adding. */
  initial?: HolderRecord
  /** The other holders on the form, for duplicate checks. */
  others: HolderRecord[]
  readOnly?: boolean
  onSave: (holder: HolderRecord) => void
}

const NAME_MAX = 50

function IdentityStep({ journey, others }: Pick<HolderEditorProps, 'journey' | 'others'>) {
  const { setValue, reset } = useFormContext<HolderRecord>()
  const nameAsPerPan = useWatch<HolderRecord, 'nameAsPerPan'>({ name: 'nameAsPerPan' })

  const verifyPan = async (pan: string): Promise<VerifyResult<PanDetails>> => {
    if (pan === journey.progress.pan) {
      return { valid: false, message: 'This PAN belongs to the primary applicant.' }
    }
    if (others.some((holder) => holder.pan === pan)) {
      return { valid: false, message: 'This PAN is already added as another holder.' }
    }
    return { valid: true, data: await journeyService.checkHolderPan(pan) }
  }

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
          label="PAN"
          required
          maxLength={10}
          transform={filters.upperAlnum}
          canVerify={isValidPan}
          onVerify={verifyPan}
          onVerified={handleVerified}
          onReset={() => reset(HOLDER_DEFAULTS)}
        />
        <TextField name="dob" label="Date of Birth" required readOnly description="Filled from the PAN" />
      </div>
      {nameAsPerPan && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Name as per PAN: </span>
          <span className="font-medium">{nameAsPerPan}</span>
        </p>
      )}
      <PersonNameFields name="name" required maxLength={NAME_MAX} onPrefixChange={handlePrefixChange} />
    </div>
  )
}

function PersonalStep() {
  const { setValue } = useFormContext<HolderRecord>()
  const fatherOrSpouse = useWatch<HolderRecord, 'fatherOrSpouse'>({ name: 'fatherOrSpouse' })

  // Switching between Father and Spouse means a different person, so the name starts over.
  const clearFatherSpouseName = () =>
    setValue('fatherSpouseName', HOLDER_DEFAULTS.fatherSpouseName, { shouldDirty: true })

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <RadioGroupField
          name="residentialStatus"
          label="Residential Status"
          required
          options={RESIDENTIAL_STATUSES}
        />
        <RadioGroupField name="gender" label="Gender" required options={GENDERS} />
        <RadioGroupField name="maritalStatus" label="Marital Status" required options={MARITAL_STATUSES} />
        <RadioGroupField
          name="fatherOrSpouse"
          label="Relation"
          required
          options={FATHER_SPOUSE_OPTIONS}
          onValueChange={clearFatherSpouseName}
        />
      </div>
      <PersonNameFields
        name="fatherSpouseName"
        labelPrefix={fatherOrSpouse === 'H' ? 'Spouse' : fatherOrSpouse === 'F' ? 'Father' : 'Father / Spouse'}
        required
        maxLength={NAME_MAX}
      />
      <PersonNameFields name="motherName" labelPrefix="Mother" withPrefix={false} maxLength={NAME_MAX} />
      <PersonNameFields name="maidenName" labelPrefix="Maiden" maxLength={NAME_MAX} />
    </div>
  )
}

function ContactStep({ journey, others }: Pick<HolderEditorProps, 'journey' | 'others'>) {
  const { getValues } = useFormContext<HolderRecord>()
  const user = useSessionUser()
  const check = (value: string) => ({
    value,
    pan: getValues('pan'),
    formNo: journey.formNo,
    empId: user.empId,
  })

  return (
    <ContactVerifyFields
      onCheckEmail={(email) => journeyService.checkHolderEmail(check(email))}
      onCheckMobile={(mobile) => journeyService.checkHolderMobile(check(mobile))}
      rejectEmail={(email) =>
        others.some((holder) => holder.email.toLowerCase() === email.toLowerCase())
          ? 'This email ID is already used by another holder.'
          : undefined
      }
      rejectMobile={(mobile) =>
        others.some((holder) => holder.mobile === mobile)
          ? 'This mobile number is already used by another holder.'
          : undefined
      }
    />
  )
}

function CorrespondenceStep() {
  const sameAsPermanent = useWatch<HolderRecord, 'sameAsPermanent'>({ name: 'sameAsPermanent' })
  return (
    <div className="grid gap-4">
      <CheckboxField name="sameAsPermanent" label="Same as permanent address" />
      {sameAsPermanent ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          The permanent address will be used for correspondence.
        </p>
      ) : (
        <AddressForm name="correspondence" />
      )}
    </div>
  )
}

/** Five-step wizard for one joint holder. Saving hands the record back; nothing is posted here. */
export function HolderEditor({ journey, editorStage, initial, others, readOnly, onSave }: HolderEditorProps) {
  const [step, setStep] = useEditorStep(editorStage)
  const form = useForm<HolderRecord>({
    resolver: zodResolver(holderSchema) as never,
    defaultValues: initial ?? HOLDER_DEFAULTS,
    mode: 'onTouched',
  })

  const steps: WizardStep[] = [
    {
      id: 'identity',
      title: 'Identity Verification',
      fields: HOLDER_STEP_FIELDS.identity,
      content: <IdentityStep journey={journey} others={others} />,
    },
    { id: 'personal', title: 'Personal Details', fields: HOLDER_STEP_FIELDS.personal, content: <PersonalStep /> },
    {
      id: 'contact',
      title: 'Contact Details',
      fields: HOLDER_STEP_FIELDS.contact,
      content: <ContactStep journey={journey} others={others} />,
    },
    {
      id: 'permanent',
      title: 'Permanent Address',
      fields: HOLDER_STEP_FIELDS.permanent,
      content: <AddressForm name="permanent" />,
    },
    {
      id: 'correspondence',
      title: 'Correspondence Address',
      fields: HOLDER_STEP_FIELDS.correspondence,
      content: <CorrespondenceStep />,
    },
  ]

  return (
    <FormProvider {...form}>
      <StageWizard
        steps={steps}
        step={step}
        onStepChange={setStep}
        readOnly={readOnly}
        submitLabel={initial ? 'Update holder' : 'Add holder'}
        onSubmit={() => onSave(form.getValues())}
      />
    </FormProvider>
  )
}
