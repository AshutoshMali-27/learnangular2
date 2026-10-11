import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { getErrorMessage, MASTER_QUERY_OPTIONS } from '@/api'
import { ComboboxField } from '@/components/form'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { journeyService } from '../../services'
import type { StageProps } from '../../types'
import { CHARGE_SHEET } from './chargeSheet'
import type { BrokerageRequest } from './types'

const STAGE_KEY = 'brokerage'

const schema = z.object({ schemeId: z.string().min(1, 'Select a brokerage scheme') })
type BrokerageValues = z.infer<typeof schema>

export const toBrokerageRequest = (
  values: BrokerageValues,
  context: { skRefNo: string; empId: string },
): BrokerageRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  BrokerageID: values.schemeId,
})

/** Stage 10: pick the brokerage scheme and confirm its charge sheet. */
export default function BrokerageStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<BrokerageValues>(current, STAGE_KEY),
    readOnly,
  )
  const form = useForm<BrokerageValues>({
    resolver: zodResolver(schema),
    defaultValues: { schemeId: '' },
    values: saved.data ?? undefined,
  })
  const schemeId = useWatch({ control: form.control, name: 'schemeId' })

  const schemes = useQuery({
    queryKey: ['brokerage', 'schemes'],
    queryFn: journeyService.getBrokerageSchemes,
    ...MASTER_QUERY_OPTIONS,
  })
  const charges = useQuery({
    queryKey: ['brokerage', 'charges', schemeId],
    queryFn: () => journeyService.getBrokerageCharges(schemeId),
    enabled: !!schemeId,
    ...MASTER_QUERY_OPTIONS,
  })

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: BrokerageRequest) => journeyService.saveBrokerage(journey, request),
    successMessage: 'Brokerage scheme saved successfully',
    viewData: () => form.getValues(),
  })

  if (saved.isLoading) return <PageLoader />

  const submit = form.handleSubmit((values) =>
    save.mutate(toBrokerageRequest(values, { skRefNo: journey.skRefNo ?? '', empId: user.empId })),
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="grid gap-6">
        <ComboboxField
          name="schemeId"
          label="Brokerage Scheme"
          required
          options={schemes.data}
          isLoading={schemes.isPending}
          searchPlaceholder="Search scheme…"
          placeholder="Select a scheme"
          disabled={readOnly}
          className="max-w-md"
        />

        {schemeId && charges.isPending && <PageLoader label="Loading charges…" />}
        {charges.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(charges.error)}
          </p>
        )}
        {charges.data && (
          <div className="grid gap-5">
            <h3 className="font-medium">{charges.data.name}</h3>
            {CHARGE_SHEET.map((section) => (
              <section key={section.title} className="grid gap-3 rounded-lg border p-4">
                <h4 className="text-sm font-medium">{section.title}</h4>
                <DescriptionList
                  className="lg:grid-cols-4"
                  items={section.rows.map((row) => ({ label: row.label, value: charges.data[row.field] }))}
                />
              </section>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {journey.progress.isBankAvailable === 'Y'
                ? 'Next: Bank Details'
                : 'This is the last stage for this form'}
            </p>
            <Button type="submit" disabled={!charges.data || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )
}
