import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { CheckboxField } from '@/components/form'
import { AddressForm } from '@/components/shared/address/AddressForm'
import { PageLoader } from '@/components/shared/PageLoader'
import { StageWizard, type WizardStep } from '@/components/shared/StageWizard'
import { useSessionUser } from '@/features/auth'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { useStageStep } from '../../hooks/useStageStep'
import { journeyService } from '../../services'
import type { Journey, StageProps } from '../../types'
import { fromAddressRequest, toAddressRequest } from './mapper'
import {
  ADDRESS_STAGE_DEFAULTS,
  ADDRESS_STEP_FIELDS,
  addressStageSchema,
  type AddressStageValues,
} from './schema'
import type { AddressRequest } from './types'

const STAGE_KEY = 'address'

const loadAddress = async (journey: Journey) => {
  const saved = await journeyService.getAddress(journey)
  return saved && fromAddressRequest(saved)
}

/** Stage 2: the primary client's permanent and correspondence addresses. */
export default function AddressStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const [step, setStep] = useStageStep(journey.formNo, STAGE_KEY)
  const saved = useStageData(journey, STAGE_KEY, loadAddress, readOnly)

  const form = useForm<AddressStageValues>({
    // The schema reads the correspondence block as a loose record so it can skip it when unused.
    resolver: zodResolver(addressStageSchema) as never,
    defaultValues: ADDRESS_STAGE_DEFAULTS,
    values: saved.data ?? undefined,
    mode: 'onTouched',
  })
  const sameAsPermanent = useWatch({ control: form.control, name: 'sameAsPermanent' })

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: AddressRequest) => journeyService.saveAddress(journey, request),
    successMessage: 'Address saved successfully',
  })

  if (saved.isLoading) return <PageLoader />

  const steps: WizardStep[] = [
    {
      id: 'permanent',
      title: 'Permanent Address',
      fields: ADDRESS_STEP_FIELDS.permanent,
      content: <AddressForm name="permanent" />,
    },
    {
      id: 'correspondence',
      title: 'Correspondence Address',
      fields: ADDRESS_STEP_FIELDS.correspondence,
      content: (
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
          save.mutate(
            // Address is reachable only after Inward, which is what assigns the reference number.
            toAddressRequest(form.getValues(), { skRefNo: journey.skRefNo ?? '', empId: user.empId }),
          )
        }
      />
    </FormProvider>
  )
}
