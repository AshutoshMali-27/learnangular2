import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { PageLoader } from '@/components/shared/PageLoader'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { useSessionUser } from '@/features/auth'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { useStageStep } from '../../hooks/useStageStep'
import { journeyService } from '../../services'
import type { Journey, StageProps } from '../../types'
import { fromInwardPayload, toInwardPayload } from './mapper'
import { INWARD_DEFAULTS, INWARD_STEP_FIELDS, inwardSchema, type InwardValues } from './schema'
import { BranchStep } from './steps/BranchStep'
import { ContactStep } from './steps/ContactStep'
import { DpStep } from './steps/DpStep'
import { PanIdentityStep } from './steps/PanIdentityStep'
import { PersonalStep } from './steps/PersonalStep'
import { ProductStep } from './steps/ProductStep'

const STAGE_KEY = 'inward'

const loadInward = async (journey: Journey) => {
  const saved = await journeyService.getInward(journey)
  return saved && fromInwardPayload(saved)
}

/** Stage 1. Saving it creates the application and returns the SK reference number. */
export default function InwardStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const [step, setStep] = useStageStep(journey.formNo, STAGE_KEY)
  const saved = useStageData(journey, STAGE_KEY, loadInward, readOnly)

  const form = useForm<InwardValues>({
    resolver: zodResolver(inwardSchema),
    defaultValues: INWARD_DEFAULTS,
    values: saved.data ?? undefined,
    mode: 'onTouched',
  })

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: journeyService.saveInward,
    successMessage: 'Form inward saved',
    successDialog: (result) => ({
      title: 'Form inward saved',
      description: `Your Reference Number is: ${result.skReferenceNo}`,
    }),
  })

  if (saved.isLoading) return <PageLoader />

  const steps: WizardStep[] = [
    { id: 'identity', title: 'PAN & Identity Details', fields: INWARD_STEP_FIELDS.identity, content: <PanIdentityStep /> },
    { id: 'personal', title: 'Personal Details', fields: INWARD_STEP_FIELDS.personal, content: <PersonalStep /> },
    { id: 'product', title: 'Product Details', fields: INWARD_STEP_FIELDS.product, content: <ProductStep /> },
    { id: 'dp', title: 'DP Details', fields: INWARD_STEP_FIELDS.dp, content: <DpStep /> },
    {
      id: 'contact',
      title: 'Contact Details',
      fields: INWARD_STEP_FIELDS.contact,
      content: <ContactStep formNo={journey.formNo} />,
    },
    { id: 'branch', title: 'Branch Details', fields: INWARD_STEP_FIELDS.branch, content: <BranchStep /> },
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
            toInwardPayload(form.getValues(), {
              formNo: journey.formNo,
              empId: user.empId,
              branchId: user.branchId,
            }),
          )
        }
      />
    </FormProvider>
  )
}
