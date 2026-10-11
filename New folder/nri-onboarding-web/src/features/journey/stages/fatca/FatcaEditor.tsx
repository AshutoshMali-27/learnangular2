import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import {
  ComboboxField,
  DateField,
  RadioGroupField,
  SelectField,
  TextField,
  VerifiableField,
  YesNoField,
} from '@/components/form'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import {
  useCountries,
  useFatcaCities,
  useFatcaCountries,
  useIncomeSlabs,
  useNationalities,
  useNatureOfBusiness,
  useOccupations,
  useSourcesOfWealth,
} from '@/features/masters'
import { shiftedIso, todayIso } from '@/lib/dates'
import { alertDialog } from '@/lib/dialog-service'
import { filters } from '@/lib/validators'
import { useEditorStep } from '../../hooks/useRecordList'
import { journeyService } from '../../services'
import type { Journey } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import { isBornInIndia, occupationBlocks, PEP, PEP_OPTIONS, SOURCE_OF_WEALTH_OTHER } from './rules'
import {
  createFatcaSchema,
  EMPTY_RESIDENCY,
  FATCA_DEFAULTS,
  FATCA_STEP_FIELDS,
  type FatcaRecord,
} from './schema'

interface FatcaEditorProps {
  journey: Journey
  editorStage: string
  /** Position of the record: 0 is the primary applicant. */
  index: number
  initial?: FatcaRecord
  readOnly?: boolean
  onSave: (record: FatcaRecord) => void
}

const grid = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'

function ProfileStep({ isPrimary }: { isPrimary: boolean }) {
  const { setValue, control } = useFormContext<FatcaRecord>()
  const countryOfBirth = useWatch({ control, name: 'countryOfBirth' })
  const occupation = useWatch({ control, name: 'occupation' })
  const sourceOfWealth = useWatch({ control, name: 'sourceOfWealth' })
  const blocks = occupationBlocks(occupation, isPrimary)

  const countries = useCountries()
  const cities = useFatcaCities()
  const occupations = useOccupations()
  const businesses = useNatureOfBusiness()
  const incomeSlabs = useIncomeSlabs()
  const sources = useSourcesOfWealth()
  const nationalities = useNationalities()

  const clearOccupationDetails = () => {
    setValue('employerName', '')
    setValue('employerCountry', '')
    setValue('employerAddress', '')
    setValue('natureOfBusiness', '')
    setValue('otherOccupation', '')
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Birth</h3>
        <div className={grid}>
          <SelectField
            name="countryOfBirth"
            label="Country of Birth"
            required
            options={countries.data}
            isLoading={countries.isPending}
            onValueChange={() => setValue('placeOfBirth', '')}
          />
          {isBornInIndia(countryOfBirth) ? (
            <ComboboxField
              name="placeOfBirth"
              label="Place of Birth"
              options={cities.data}
              isLoading={cities.isPending}
              searchPlaceholder="Search city…"
              clearable
            />
          ) : (
            <TextField name="placeOfBirth" label="Place of Birth" maxLength={50} transform={filters.personName} />
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Occupation</h3>
        <div className={grid}>
          <SelectField
            name="occupation"
            label="Occupation"
            required
            options={occupations.data}
            isLoading={occupations.isPending}
            onValueChange={clearOccupationDetails}
          />
          {blocks.employer && (
            <>
              <TextField name="employerName" label="Employer Name" required maxLength={100} />
              <SelectField
                name="employerCountry"
                label="Employer Country"
                required
                options={countries.data}
                isLoading={countries.isPending}
              />
              <TextField
                name="employerAddress"
                label="Employer Address"
                required
                maxLength={50}
                transform={filters.addressLine}
              />
            </>
          )}
          {blocks.business && (
            <SelectField
              name="natureOfBusiness"
              label="Nature of Business"
              required
              options={businesses.data}
              isLoading={businesses.isPending}
            />
          )}
          {blocks.other && (
            <TextField name="otherOccupation" label="Other Occupation Details" required maxLength={200} />
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Residence and finances</h3>
        <div className={grid}>
          <SelectField
            name="countryOfResidence"
            label="Country of Residence"
            required
            options={countries.data}
            isLoading={countries.isPending}
          />
          <SelectField
            name="incomeSlab"
            label="Income Slab"
            required
            options={incomeSlabs.data}
            isLoading={incomeSlabs.isPending}
          />
          <SelectField
            name="sourceOfWealth"
            label="Source of Wealth"
            required
            options={sources.data}
            isLoading={sources.isPending}
            onValueChange={() => setValue('sourceOfWealthOther', '')}
          />
          {sourceOfWealth === SOURCE_OF_WEALTH_OTHER && (
            <TextField name="sourceOfWealthOther" label="Source of Wealth (other)" required maxLength={50} />
          )}
          <TextField
            name="netWorth"
            label="Net Worth"
            required
            inputMode="decimal"
            maxLength={15}
            transform={(value) => value.replace(/[^\d.]/g, '')}
          />
          <DateField
            name="netWorthDate"
            label="Net Worth As on Date"
            required
            min={shiftedIso({ years: -1 })}
            max={todayIso()}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">Nationality</h3>
        <div className={grid}>
          <ComboboxField
            name="nationality"
            label="Nationality"
            required
            options={nationalities.data}
            isLoading={nationalities.isPending}
            searchPlaceholder="Search nationality…"
          />
          <SelectField
            name="citizenship"
            label="Citizenship"
            required
            options={countries.data}
            isLoading={countries.isPending}
          />
        </div>
      </section>
    </div>
  )
}

function DeclarationsStep({ journey, isPrimary }: { journey: Journey; isPrimary: boolean }) {
  const { control, setValue } = useFormContext<FatcaRecord>()
  const pep = useWatch({ control, name: 'pep' })
  const needsApproval = isPrimary && pep === PEP

  const handlePepChange = (next: string) => {
    if (next !== PEP) setValue('pepDocument', null)
    if (isPrimary && next === PEP) {
      void alertDialog({
        title: 'Compliance approval required',
        description:
          'As you have identified the client as a Politically Exposed Person (PEP), additional approval is required from compliance before proceeding. An approval email must be uploaded.',
      })
    }
  }

  return (
    <div className="grid gap-5">
      <RadioGroupField
        name="pep"
        label="Politically Exposed Person"
        required
        options={PEP_OPTIONS}
        orientation="vertical"
        className="sm:[&_[role=radiogroup]]:grid-cols-2"
        onValueChange={handlePepChange}
      />
      {needsApproval && (
        <FileUpload
          name="pepDocument"
          label="PEP Approval Document"
          required
          accept={['.jpg', '.jpeg', '.png', '.pdf', '.eml']}
          onUpload={uploadHandler('fatcaPep', journey)}
          onView={viewDocument}
          className="max-w-md"
        />
      )}
      <YesNoField name="usPerson" label="Are you a US person?" required />
    </div>
  )
}

function ResidencyRow({ journey, index }: { journey: Journey; index: number }) {
  const { control, setValue, getValues } = useFormContext<FatcaRecord>()
  const row = useWatch({ control, name: `residencies.${index}` })
  const previous = useWatch({ control, name: `residencies.${Math.max(index - 1, 0)}` })
  const countries = useFatcaCountries()

  // Rows open one after another: a row unlocks once the one before it is validated.
  const unlocked = index === 0 || previous.tinStatus === 'valid'
  const locked = row.tinStatus === 'valid'
  const path = (field: string) => `residencies.${index}.${field}`

  const verifyTin = async (tin: string) => {
    const current = getValues(`residencies.${index}`)
    const country = countries.data?.find((option) => option.value === current.countryId)
    await journeyService.validateTin(index + 1, country?.meta?.code ?? '', tin)
    return { valid: true }
  }

  return (
    <fieldset
      disabled={!unlocked}
      className="grid gap-4 rounded-md border p-4 disabled:opacity-60"
      aria-label={`Tax residency ${index + 1}`}
    >
      <legend className="px-1 text-sm font-medium">
        Tax residency {index + 1}
        {index > 0 && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </legend>
      {!unlocked && (
        <p className="text-sm text-muted-foreground">Validate residency {index} to add another country.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name={path('countryId')}
          label="Country"
          required={index === 0}
          options={countries.data}
          isLoading={countries.isPending}
          disabled={locked}
        />
        <DateField name={path('fromDate')} label="From Date" max={todayIso()} disabled={locked} />
      </div>
      <FileUpload
        name={path('proof')}
        label="TIN proof"
        required={index === 0}
        onUpload={uploadHandler('fatcaTin', journey)}
        onView={viewDocument}
        disabled={locked}
        description="Upload the proof before validating the TIN"
      />
      <VerifiableField
        name={path('tin')}
        statusName={path('tinStatus')}
        label="TIN"
        required={index === 0}
        maxLength={30}
        transform={(value) => value.replace(/[^A-Za-z0-9.-]/g, '')}
        canVerify={(tin) => Boolean(tin && row.countryId && row.proof)}
        onVerify={verifyTin}
        onReset={() => setValue(`residencies.${index}`, EMPTY_RESIDENCY)}
      />
    </fieldset>
  )
}

function TaxResidencyStep({ journey }: { journey: Journey }) {
  const { control, setValue } = useFormContext<FatcaRecord>()
  const hasResidency = useWatch({ control, name: 'hasForeignTaxResidency' }) === 'Y'

  return (
    <div className="grid gap-5">
      <YesNoField
        name="hasForeignTaxResidency"
        label="Do you have tax residency outside India?"
        required
        onValueChange={(answer) => {
          if (answer === 'N') setValue('residencies', FATCA_DEFAULTS.residencies)
        }}
      />
      {hasResidency && (
        <div className="grid gap-4 xl:grid-cols-3">
          {FATCA_DEFAULTS.residencies.map((_, index) => (
            <ResidencyRow key={index} journey={journey} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Three-step FATCA / CRS declaration for one holder. */
export function FatcaEditor({ journey, editorStage, index, initial, readOnly, onSave }: FatcaEditorProps) {
  const [step, setStep] = useEditorStep(editorStage)
  const isPrimary = index === 0
  const form = useForm<FatcaRecord>({
    resolver: zodResolver(createFatcaSchema({ isPrimary, nriCategory: journey.progress.nriCategory })),
    defaultValues: initial ?? FATCA_DEFAULTS,
    mode: 'onTouched',
  })

  const steps: WizardStep[] = [
    {
      id: 'profile',
      title: 'Birth, Occupation & Finances',
      fields: FATCA_STEP_FIELDS.profile,
      content: <ProfileStep isPrimary={isPrimary} />,
    },
    {
      id: 'declarations',
      title: 'PEP & US Person',
      fields: FATCA_STEP_FIELDS.declarations,
      content: <DeclarationsStep journey={journey} isPrimary={isPrimary} />,
    },
    {
      id: 'tax-residency',
      title: 'Tax Residency',
      fields: FATCA_STEP_FIELDS.taxResidency,
      content: <TaxResidencyStep journey={journey} />,
    },
  ]

  return (
    <FormProvider {...form}>
      <StageWizard
        steps={steps}
        step={step}
        onStepChange={setStep}
        readOnly={readOnly}
        submitLabel={initial ? 'Update FATCA' : 'Add FATCA'}
        onSubmit={() => onSave(form.getValues())}
      />
    </FormProvider>
  )
}
