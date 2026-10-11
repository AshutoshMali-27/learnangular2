import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import {
  CheckboxField,
  NumberStepper,
  RadioGroupField,
  SelectField,
  TextField,
  YesNoField,
} from '@/components/form'
import type { Option } from '@/components/form'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { PageLoader } from '@/components/shared/PageLoader'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { useSessionUser } from '@/features/auth'
import { useCountries, useKmpDesignations } from '@/features/masters'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { useStageStep } from '../../hooks/useStageStep'
import { journeyService } from '../../services'
import type { Journey, StageProps } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import { toExtraDetailsRequest } from './mapper'
import {
  EXTRA_DETAILS_DEFAULTS,
  EXTRA_DETAILS_STEP_FIELDS,
  extraDetailsSchema,
  STAFF_BLOCKS,
  type ExtraDetailsValues,
} from './schema'
import { StaffVerificationBlock } from './StaffVerificationBlock'
import type { ExtraDetailsRequest } from './types'

const STAGE_KEY = 'extra-details'

// The backend stores these two answers as 1 / 0 rather than Y / N.
const ONE_ZERO: Option[] = [
  { value: '1', label: 'Yes' },
  { value: '0', label: 'No' },
]

const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

function DetailsStep() {
  const { control, setValue } = useFormContext<ExtraDetailsValues>()
  const hasPriorExperience = useWatch({ control, name: 'hasPriorExperience' })
  const countries = useCountries()
  const kmpDesignations = useKmpDesignations()

  const resetExperience = (checked: boolean) => {
    if (checked) return
    setValue('experienceYears', 0)
    setValue('derivativesYears', 0)
    setValue('otherInvestmentYears', 0)
  }

  return (
    <div className="grid gap-6">
      <YesNoField
        name="isBankAvailable"
        label="Does the client have a bank account to link?"
        required
        description="Yes adds the Bank Details stage after Brokerage"
        className="rounded-lg border p-4"
      />

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Residence and background</h3>
        <div className={grid}>
          <SelectField
            name="countryOfResidence"
            label="Country of Residence"
            options={countries.data}
            isLoading={countries.isPending}
          />
          <SelectField
            name="countrySourceIncome"
            label="Country Source Income"
            options={countries.data}
            isLoading={countries.isPending}
          />
          <SelectField
            name="citizenship"
            label="Citizenship"
            options={countries.data}
            isLoading={countries.isPending}
          />
          <TextField
            name="investmentThroughSharekhan"
            label="Investment Through Sharekhan"
            inputMode="decimal"
            maxLength={15}
            transform={(value) => value.replace(/[^\d.]/g, '')}
          />
          <TextField name="natureOfBusiness" label="Nature of Business" maxLength={100} />
          <TextField name="formerAliasName" label="Former Alias Name" maxLength={100} />
          <SelectField
            name="kmpDesignationId"
            label="KMP Designation"
            options={kmpDesignations.data}
            isLoading={kmpDesignations.isPending}
          />
          <TextField name="kmpDesignationDescription" label="KMP Designation Description" maxLength={100} />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Declarations</h3>
        <div className={grid}>
          <RadioGroupField name="accessInsiderInfo" label="Access to insider information" options={ONE_ZERO} />
          <TextField name="accessInsiderInfoRemark" label="Remark" maxLength={200} />
          <RadioGroupField
            name="sensitiveProductServices"
            label="Uses sensitive products / services"
            options={ONE_ZERO}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Investment / trading experience</h3>
        <CheckboxField
          name="hasPriorExperience"
          label="Has prior investment experience"
          onValueChange={resetExperience}
        />
        {hasPriorExperience && (
          <div className={grid}>
            <NumberStepper name="experienceYears" label="Years of experience" required />
            <NumberStepper name="derivativesYears" label="Years in derivatives" />
            <NumberStepper name="otherInvestmentYears" label="Years in other investment fields" />
          </div>
        )}
      </section>
    </div>
  )
}

function VerificationStep({ journey }: { journey: Journey }) {
  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        Enter a staff code and choose Look up to fill the name, designation and signature from the e-sign
        record.
      </p>
      {STAFF_BLOCKS.map((block) => (
        <div key={block.key} className="grid gap-4">
          <StaffVerificationBlock
            journey={journey}
            name={block.key}
            title={block.title}
            codeLabel={block.codeLabel}
            required={block.required}
          />
          {block.key === 'interview' && (
            <TextField name="interviewPlace" label="Interviewed Place" maxLength={100} className="max-w-md" />
          )}
        </div>
      ))}
      <FileUpload
        name="factiva"
        label="Factiva upload (optional)"
        accept={['.jpg', '.jpeg', '.png', '.pdf', '.eml']}
        onUpload={uploadHandler('extraDetails', journey)}
        onView={viewDocument}
        className="max-w-md"
      />
    </div>
  )
}

/** Stage 9: remaining KYC details, the bank-account answer, and the OSV / IPV verification. */
export default function ExtraDetailsStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const [step, setStep] = useStageStep(journey.formNo, STAGE_KEY)
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<ExtraDetailsValues>(current, STAGE_KEY),
    readOnly,
  )

  const form = useForm<ExtraDetailsValues>({
    resolver: zodResolver(extraDetailsSchema),
    defaultValues: EXTRA_DETAILS_DEFAULTS,
    values: saved.data ?? undefined,
    mode: 'onTouched',
  })

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: ExtraDetailsRequest) => journeyService.saveExtraDetails(journey, request),
    successMessage: 'Extra details saved successfully',
    viewData: () => form.getValues(),
  })

  if (saved.isLoading) return <PageLoader />

  const steps: WizardStep[] = [
    {
      id: 'details',
      title: 'Extra Details & Experience',
      fields: EXTRA_DETAILS_STEP_FIELDS.details,
      content: <DetailsStep />,
    },
    {
      id: 'verification',
      title: 'IPV & Other Details',
      fields: EXTRA_DETAILS_STEP_FIELDS.verification,
      content: <VerificationStep journey={journey} />,
    },
  ]

  return (
    <FormProvider {...form}>
      <StageWizard
        steps={steps}
        step={step}
        onStepChange={setStep}
        readOnly={readOnly}
        isSubmitting={save.isPending}
        onSubmit={() =>
          save.mutate(
            toExtraDetailsRequest(form.getValues(), {
              formNo: journey.formNo,
              skRefNo: journey.skRefNo ?? '',
              empId: user.empId,
              branchId: user.branchId,
              pan: journey.progress.pan,
            }),
          )
        }
      />
    </FormProvider>
  )
}
