import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { TextField, YesNoField } from '@/components/form'
import { PageLoader } from '@/components/shared/PageLoader'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { filters } from '@/lib/validators'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { useStageStep } from '../../hooks/useStageStep'
import { journeyService } from '../../services'
import type { StageProps } from '../../types'
import { toMiscRequest } from './mapper'
import { CONSENTS, MISC_DEFAULTS, MISC_FIELDS, miscSchema, OTHER_BROKER_DEALING, type MiscValues } from './schema'
import type { MiscRequest } from './types'

const STAGE_KEY = 'miscellaneous'

/** Stage 7: the client's declarations and standing instructions, all Yes / No. */
export default function MiscellaneousStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const [step, setStep] = useStageStep(journey.formNo, STAGE_KEY)
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<MiscValues>(current, STAGE_KEY),
    readOnly,
  )

  const form = useForm<MiscValues>({
    resolver: zodResolver(miscSchema),
    defaultValues: MISC_DEFAULTS,
    values: saved.data ?? undefined,
  })
  const dealsThroughAuthorisedPerson =
    useWatch({ control: form.control, name: `answers.${OTHER_BROKER_DEALING}` }) === 'Y'

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: MiscRequest) => journeyService.saveMisc(journey, request),
    successMessage: 'Miscellaneous details saved successfully',
    viewData: () => form.getValues(),
  })

  if (saved.isLoading) return <PageLoader />

  const answerAll = (answer: 'Y' | 'N') =>
    form.setValue('answers', Object.fromEntries(CONSENTS.map(({ name }) => [name, answer])), {
      shouldValidate: form.formState.isSubmitted,
      shouldDirty: true,
    })

  const steps: WizardStep[] = [
    {
      id: 'declarations',
      title: 'Declarations & standing instructions',
      fields: MISC_FIELDS,
      content: (
        <div className="grid gap-5">
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Quick fill:
              <Button type="button" variant="outline" size="sm" onClick={() => answerAll('Y')}>
                Yes to all
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => answerAll('N')}>
                No to all
              </Button>
            </div>
          )}
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            {CONSENTS.map((consent) => (
              <YesNoField key={consent.name} name={`answers.${consent.name}`} label={consent.label} required />
            ))}
          </div>
          {dealsThroughAuthorisedPerson && (
            <TextField
              name="authorizedPersonName"
              label="Name of authorised person"
              required
              maxLength={100}
              transform={filters.personName}
              className="max-w-md"
            />
          )}
        </div>
      ),
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
          save.mutate(toMiscRequest(form.getValues(), { skRefNo: journey.skRefNo ?? '', empId: user.empId }))
        }
      />
    </FormProvider>
  )
}
