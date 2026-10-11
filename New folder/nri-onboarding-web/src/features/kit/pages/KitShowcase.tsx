import { zodResolver } from '@hookform/resolvers/zod'
import type { ColumnDef } from '@tanstack/react-table'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  CheckboxField,
  CheckboxGroupField,
  ComboboxField,
  DateField,
  NumberStepper,
  RadioGroupField,
  SelectField,
  VerifiableField,
  YesNoField,
  type VerifyResult,
} from '@/components/form'
import { AddressForm } from '@/components/shared/address/AddressForm'
import {
  addressFields,
  addressSchema,
  EMPTY_ADDRESS,
} from '@/components/shared/address/address.schema'
import { DataTable } from '@/components/shared/DataTable'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { EntityCardList } from '@/components/shared/EntityCardList'
import { FileUpload, type UploadHandler } from '@/components/shared/file-upload/FileUpload'
import { ObjectionBanner } from '@/components/shared/ObjectionBanner'
import { PersonNameFields } from '@/components/shared/PersonNameFields'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GENDERS, useRelations, useServingBranches } from '@/features/masters'
import { alertDialog, confirm } from '@/lib/dialog-service'
import { splitFullName } from '@/lib/names'
import { filters, isValidPan } from '@/lib/validators'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { draftCleared, draftStepChanged } from '@/store/slices/draftsSlice'

// Dev-only page that exercises every shared component with sample data and fake API calls.
// It is also the reference for how a stage page is assembled.

const STAGE = 'kit'

const schema = z
  .object({
    pan: z.string().refine(isValidPan, 'Enter a valid individual PAN'),
    panStatus: z.enum(['idle', 'valid', 'invalid']).refine((status): boolean => status === 'valid', {
      message: 'Validate the PAN to continue',
    }),
    dob: z.string().min(1, 'Date of birth is required'),
    name: z.object({
      prefix: z.string().min(1, 'Prefix is required'),
      firstName: z.string().min(1, 'First name is required'),
      middleName: z.string(),
      lastName: z.string(),
    }),
    gender: z.string().min(1, 'Select a gender'),
    nriTypes: z.array(z.string()).min(1, 'Select at least one NRI type'),
    smsAlerts: z.string().min(1, 'Choose Yes or No'),
    hni: z.boolean(),
    experienceYears: z.number().min(0).max(99),
    relation: z.string().min(1, 'Relationship is required'),
    branch: z.string(),
    permanent: addressSchema,
    sameAsPermanent: z.boolean(),
    // Validated below only when it differs from the permanent address.
    correspondence: z.record(z.string(), z.string()),
    document: z
      .object({ filePath: z.string(), fileName: z.string() })
      .nullable()
      .refine((file) => file !== null, 'Upload a document'),
  })
  .superRefine((values, context) => {
    if (values.sameAsPermanent) return
    const result = addressSchema.safeParse(values.correspondence)
    if (result.success) return
    for (const issue of result.error.issues) {
      context.addIssue({ code: 'custom', message: issue.message, path: ['correspondence', ...issue.path] })
    }
  })

type DemoValues = z.input<typeof schema>

const DEFAULTS: DemoValues = {
  pan: '',
  panStatus: 'idle',
  dob: '',
  name: { prefix: '', firstName: '', middleName: '', lastName: '' },
  gender: '',
  nriTypes: [],
  smsAlerts: '',
  hni: false,
  experienceYears: 0,
  relation: '',
  branch: '',
  permanent: EMPTY_ADDRESS,
  sameAsPermanent: false,
  correspondence: EMPTY_ADDRESS,
  document: null,
}

const NRI_TYPES = [
  { value: 'NRE_PIS', label: 'NRE PIS' },
  { value: 'NRE_NONPIS', label: 'NRE NONPIS' },
  { value: 'NRO_PIS', label: 'NRO PIS' },
  { value: 'NRO_NONPIS', label: 'NRO NONPIS' },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Stand-in for CheckPanNo: any PAN ending in Z is rejected. */
const fakeVerifyPan = async (pan: string): Promise<VerifyResult> => {
  await wait(700)
  return pan.endsWith('Z')
    ? { valid: false, message: 'PAN not found in ITD records (sample failure).' }
    : { valid: true }
}

/** Stand-in for an UploadFile action. */
const fakeUpload: UploadHandler = async (_file, fileName, { onProgress }) => {
  for (const percent of [20, 45, 70, 90, 100]) {
    await wait(150)
    onProgress(percent)
  }
  return { filePath: `NRI000123_ABCPE1234F/${fileName}`, fileName }
}

function DemoWizard() {
  const dispatch = useAppDispatch()
  const step = useAppSelector((state) => state.drafts[STAGE]?.step ?? 0)
  const relations = useRelations()
  const branches = useServingBranches()
  const form = useForm<DemoValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
    mode: 'onTouched',
  })
  const sameAsPermanent = useWatch({ control: form.control, name: 'sameAsPermanent' })

  const handlePanVerified = () => {
    // The real stage fills these from the CheckPanNo response.
    const name = splitFullName('RAHUL KUMAR SHARMA')
    form.setValue('name.firstName', name.firstName)
    form.setValue('name.middleName', name.middleName)
    form.setValue('name.lastName', name.lastName)
    form.setValue('dob', '1990-01-15', { shouldValidate: true })
  }

  const handlePrefixChange = (prefix: string) => {
    // Dependent default applied in the change handler, not in an effect.
    if (prefix === 'Mr.') form.setValue('gender', 'M', { shouldValidate: true })
    if (prefix === 'Mrs.' || prefix === 'Miss') form.setValue('gender', 'F', { shouldValidate: true })
  }

  const handleSave = async () => {
    const values = form.getValues()
    await alertDialog({
      title: 'Saved (sample)',
      description: `PAN ${values.pan} validated and the form passed every step.`,
    })
    form.reset(DEFAULTS)
    dispatch(draftCleared(STAGE))
  }

  const steps: WizardStep[] = [
    {
      id: 'identity',
      title: 'Identity',
      fields: ['pan', 'panStatus', 'dob', 'name', 'gender'],
      content: (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <VerifiableField
              name="pan"
              statusName="panStatus"
              label="PAN Number"
              required
              maxLength={10}
              transform={filters.upperAlnum}
              canVerify={isValidPan}
              onVerify={fakeVerifyPan}
              onVerified={handlePanVerified}
              onReset={() => form.reset({ ...form.getValues(), ...DEFAULTS })}
              description="Try ABCPE1234F (passes) or ABCPE1234Z (fails)"
            />
            <DateField name="dob" label="Date of Birth" required readOnly />
          </div>
          <PersonNameFields name="name" required onPrefixChange={handlePrefixChange} />
          <RadioGroupField name="gender" label="Gender" required options={GENDERS} />
        </div>
      ),
    },
    {
      id: 'preferences',
      title: 'Preferences',
      fields: ['nriTypes', 'smsAlerts', 'relation', 'branch', 'experienceYears'],
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxGroupField
            name="nriTypes"
            label="NRI Type"
            required
            options={NRI_TYPES}
            className="sm:col-span-2"
          />
          <YesNoField name="smsAlerts" label="SMS alerts" required />
          <CheckboxField name="hni" label="HNI client" />
          <SelectField
            name="relation"
            label="Email Relationship"
            required
            options={relations.data}
            isLoading={relations.isPending}
          />
          <ComboboxField
            name="branch"
            label="Preferred Branch"
            options={branches.data}
            isLoading={branches.isPending}
            clearable
          />
          <NumberStepper name="experienceYears" label="Trading experience (years)" />
        </div>
      ),
    },
    {
      id: 'address',
      title: 'Address & Document',
      fields: [...addressFields('permanent'), ...addressFields('correspondence'), 'document'],
      content: (
        <div className="grid gap-6">
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">Permanent address</h3>
            <AddressForm name="permanent" />
          </section>
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">Correspondence address</h3>
            <CheckboxField name="sameAsPermanent" label="Same as permanent address" />
            {!sameAsPermanent && <AddressForm name="correspondence" />}
          </section>
          <FileUpload
            name="document"
            label="Address proof"
            required
            onUpload={fakeUpload}
            onView={(file) => toast.info(`Would open ${file.filePath}`)}
            className="max-w-md"
          />
        </div>
      ),
    },
  ]

  return (
    <FormProvider {...form}>
      <StageWizard
        steps={steps}
        step={step}
        onStepChange={(next) => dispatch(draftStepChanged({ stage: STAGE, step: next }))}
        onSubmit={handleSave}
      />
    </FormProvider>
  )
}

interface SampleHolder {
  id: string
  name: string
  pan: string
  type: '2ND' | '3RD'
  email: string
}

const HOLDERS: SampleHolder[] = [
  { id: '1', name: 'Priya Sharma', pan: 'ABCPS1234K', type: '2ND', email: 'priya@example.com' },
  { id: '2', name: 'Amit Sharma', pan: 'ABCPA5678L', type: '3RD', email: 'amit@example.com' },
]

interface SampleForm {
  formNo: string
  client: string
  pan: string
  stage: string
  updatedOn: string
}

const FORMS: SampleForm[] = Array.from({ length: 23 }, (_, index) => ({
  formNo: `NRI${String(100 + index).padStart(6, '0')}`,
  client: ['Rahul Sharma', 'Neha Patel', 'Vikram Rao', 'Anita Desai'][index % 4],
  pan: `ABCP${'RNVA'[index % 4]}${1000 + index}F`,
  stage: ['Inward', 'Address', 'Holder', 'FATCA', 'Proof'][index % 5],
  updatedOn: `2026-10-${String((index % 9) + 1).padStart(2, '0')}`,
}))

const FORM_COLUMNS: ColumnDef<SampleForm, unknown>[] = [
  { accessorKey: 'formNo', header: 'Form No' },
  { accessorKey: 'client', header: 'Client' },
  { accessorKey: 'pan', header: 'PAN' },
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => <Badge variant="secondary">{row.original.stage}</Badge>,
  },
  { accessorKey: 'updatedOn', header: 'Updated On' },
  {
    id: 'actions',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => (
      <Button size="sm" variant="outline" onClick={() => toast.info(`Open ${row.original.formNo}`)}>
        Resume
      </Button>
    ),
  },
]

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function KitShowcase() {
  const askDelete = async (holder: SampleHolder) => {
    const confirmed = await confirm({
      title: 'Remove holder?',
      description: `${holder.name} will be removed from this form.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) toast.success(`${holder.name} removed (sample)`)
  }

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="text-xl font-semibold">Shared component kit</h1>
        <p className="text-sm text-muted-foreground">
          Sample data and fake calls only. Every stage and report screen is built from these parts.
        </p>
      </header>

      <ObjectionBanner
        stageName="Inward"
        remarks="Please re-check the contact details."
        objections={[
          { id: '1', text: 'Email ID does not match the application form.' },
          { id: '2', text: 'Mobile relationship should be Self.' },
        ]}
      />

      <Section
        title="Stage wizard and form fields"
        description="Next validates only the current step. The step position is kept in the Redux drafts slice."
      >
        <DemoWizard />
      </Section>

      <Section title="Record cards" description="Joint holders, FATCA records, documents and nominees.">
        <EntityCardList
          items={HOLDERS}
          max={2}
          addLabel="Add Holder"
          getKey={(holder) => holder.id}
          renderTitle={(holder) => holder.name}
          renderBadge={(holder) => <Badge>{holder.type}</Badge>}
          renderBody={(holder) => (
            <DescriptionList
              className="sm:grid-cols-1 lg:grid-cols-1"
              items={[
                { label: 'PAN', value: holder.pan },
                { label: 'Email', value: holder.email },
              ]}
            />
          )}
          onAdd={() => toast.info('Would open the holder wizard')}
          onEdit={(holder) => toast.info(`Would edit ${holder.name}`)}
          onDelete={askDelete}
        />
      </Section>

      <Section title="Data table" description="Sorting, search and paging for list and report screens.">
        <DataTable
          columns={FORM_COLUMNS}
          data={FORMS}
          searchPlaceholder="Search forms…"
          toolbar={
            <Button variant="outline" onClick={() => toast.info('Would export the list')}>
              Export
            </Button>
          }
        />
      </Section>

      <Section title="Dialogs and toasts" description="Replacements for SweetAlert popups.">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              alertDialog({ title: 'Your Reference Number is: 100045', description: 'Form inward saved.' })
            }
          >
            Alert
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const confirmed = await confirm({ title: 'Skip holder?', description: 'No joint holders will be added.' })
              toast(confirmed ? 'Confirmed' : 'Cancelled')
            }}
          >
            Confirm
          </Button>
          <Button variant="outline" onClick={() => toast.success('Holder saved successfully')}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => toast.error('Account number could not be verified')}>
            Error toast
          </Button>
        </div>
      </Section>
    </div>
  )
}
