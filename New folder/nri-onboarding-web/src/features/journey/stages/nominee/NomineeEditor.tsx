import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { DateField, SelectField, TextField } from '@/components/form'
import { AddressForm } from '@/components/shared/address/AddressForm'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { PersonNameFields } from '@/components/shared/PersonNameFields'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { useDocumentTypes, useNomineeRelations } from '@/features/masters'
import { shiftedIso } from '@/lib/dates'
import { filters } from '@/lib/validators'
import { useEditorStep } from '../../hooks/useRecordList'
import type { Journey } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import {
  ADULT_AGE,
  isMinor,
  NOMINEE_PROOF_TYPE_IDS,
  PROOF_TYPE,
  RELATION_OTHER,
  shareTotal,
  type NomineeAccount,
} from './rules'
import { createNomineeSchema, NOMINEE_DEFAULTS, NOMINEE_STEP_FIELDS, type NomineeRecord } from './schema'

interface NomineeEditorProps {
  journey: Journey
  account: NomineeAccount
  editorStage: string
  initial?: NomineeRecord
  /** The account's other nominees. */
  others: NomineeRecord[]
  readOnly?: boolean
  onSave: (nominee: NomineeRecord) => void
}

const NAME_MAX = 50
const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

const proofNumberFilter = (proofTypeId: string) =>
  proofTypeId === PROOF_TYPE.AADHAAR ? filters.digits : filters.upperAlnum

function RelationFields({ prefix, label }: { prefix: '' | 'guardian.'; label: string }) {
  const relations = useNomineeRelations()
  const relationId = useWatch({ name: `${prefix}relationId` })
  const { setValue } = useFormContext()

  return (
    <>
      <SelectField
        name={`${prefix}relationId`}
        label={label}
        required
        options={relations.data}
        isLoading={relations.isPending}
        onValueChange={() => setValue(`${prefix}relationOther`, '')}
      />
      {relationId === RELATION_OTHER && (
        <TextField name={`${prefix}relationOther`} label="Relationship (other)" required maxLength={50} />
      )}
    </>
  )
}

function ContactFields({ prefix }: { prefix: '' | 'guardian.' }) {
  return (
    <div className={grid}>
      <TextField
        name={`${prefix}mobile`}
        label="Mobile No."
        required
        inputMode="numeric"
        maxLength={15}
        transform={filters.digits}
      />
      <TextField
        name={`${prefix}telephone`}
        label="Telephone No."
        inputMode="numeric"
        maxLength={15}
        transform={filters.digits}
      />
      <TextField name={`${prefix}email`} label="Email ID" required type="email" maxLength={120} />
    </div>
  )
}

function InfoStep({ remainingShare }: { remainingShare: number }) {
  const { setValue } = useFormContext<NomineeRecord>()
  const proofTypeId = useWatch<NomineeRecord, 'proofTypeId'>({ name: 'proofTypeId' })
  const dob = useWatch<NomineeRecord, 'dob'>({ name: 'dob' })
  const docTypes = useDocumentTypes()
  const proofTypes = docTypes.data?.filter((type) => NOMINEE_PROOF_TYPE_IDS.includes(type.value))

  return (
    <div className="grid gap-5">
      <div className={grid}>
        <SelectField
          name="proofTypeId"
          label="Proof Type"
          required
          options={proofTypes}
          isLoading={docTypes.isPending}
          onValueChange={() => setValue('proofNumber', '')}
        />
        <TextField
          name="proofNumber"
          label="Proof Number"
          required
          maxLength={proofTypeId === PROOF_TYPE.AADHAAR ? 12 : 20}
          transform={proofNumberFilter(proofTypeId)}
          disabled={!proofTypeId}
        />
      </div>
      <PersonNameFields name="name" required maxLength={NAME_MAX} />
      <div className={grid}>
        <DateField
          name="dob"
          label="Date of Birth"
          required
          max={shiftedIso({ days: -1 })}
          description={isMinor(dob) ? 'Minor: guardian details will be asked next' : undefined}
        />
        <TextField
          name="share"
          label="Share %"
          required
          inputMode="numeric"
          maxLength={3}
          transform={filters.digits}
          description={`${remainingShare}% left to allocate for this account`}
        />
        <RelationFields prefix="" label="Relationship with client" />
      </div>
    </div>
  )
}

function ContactStep({ journey }: { journey: Journey }) {
  return (
    <div className="grid gap-5">
      <AddressForm name="address" compact />
      <ContactFields prefix="" />
      <FileUpload
        name="proof"
        label="Nominee proof"
        onUpload={uploadHandler('nominee', journey)}
        onView={viewDocument}
        className="max-w-md"
      />
    </div>
  )
}

function GuardianInfoStep() {
  return (
    <div className="grid gap-5">
      <div className={grid}>
        <TextField
          name="guardian.proofNumber"
          label="Guardian PAN"
          required
          maxLength={10}
          transform={filters.upperAlnum}
        />
        <DateField
          name="guardian.dob"
          label="Date of Birth"
          required
          max={shiftedIso({ years: -ADULT_AGE })}
          description="A guardian must be 18 or older"
        />
      </div>
      <PersonNameFields name="guardian.name" required maxLength={NAME_MAX} />
      <div className={grid}>
        <RelationFields prefix="guardian." label="Relationship with nominee" />
      </div>
    </div>
  )
}

function GuardianContactStep({ journey }: { journey: Journey }) {
  return (
    <div className="grid gap-5">
      <AddressForm name="guardian.address" compact />
      <ContactFields prefix="guardian." />
      <FileUpload
        name="guardian.proof"
        label="Guardian proof"
        required
        onUpload={uploadHandler('nominee', journey)}
        onView={viewDocument}
        className="max-w-md"
      />
    </div>
  )
}

/** Wizard for one nominee: two steps, or four when the nominee is a minor and needs a guardian. */
export function NomineeEditor({
  journey,
  account,
  editorStage,
  initial,
  others,
  readOnly,
  onSave,
}: NomineeEditorProps) {
  const [step, setStep] = useEditorStep(editorStage)
  const othersShare = shareTotal(others)
  const form = useForm<NomineeRecord>({
    resolver: zodResolver(
      createNomineeSchema({ clientPan: journey.progress.pan, others, othersShare }),
    ) as never,
    defaultValues: initial ?? NOMINEE_DEFAULTS,
    mode: 'onTouched',
  })
  const needsGuardian = isMinor(useWatch({ control: form.control, name: 'dob' }))

  const steps: WizardStep[] = [
    {
      id: 'info',
      title: 'Nominee Information',
      fields: NOMINEE_STEP_FIELDS.info,
      content: <InfoStep remainingShare={100 - othersShare} />,
    },
    {
      id: 'contact',
      title: 'Nominee Address & Contact',
      fields: NOMINEE_STEP_FIELDS.contact,
      content: <ContactStep journey={journey} />,
    },
    ...(needsGuardian
      ? [
          {
            id: 'guardian-info',
            title: 'Guardian Information',
            fields: NOMINEE_STEP_FIELDS.guardianInfo,
            content: <GuardianInfoStep />,
          },
          {
            id: 'guardian-contact',
            title: 'Guardian Address & Contact',
            fields: NOMINEE_STEP_FIELDS.guardianContact,
            content: <GuardianContactStep journey={journey} />,
          },
        ]
      : []),
  ]

  return (
    <FormProvider {...form}>
      <StageWizard
        steps={steps}
        step={step}
        onStepChange={setStep}
        readOnly={readOnly}
        submitLabel={initial ? `Update ${account} nominee` : `Add ${account} nominee`}
        onSubmit={() => onSave(form.getValues())}
      />
    </FormProvider>
  )
}
