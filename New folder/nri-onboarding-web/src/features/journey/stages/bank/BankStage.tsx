import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { FileUpload } from '@/components/shared/file-upload/FileUpload'
import { PageLoader } from '@/components/shared/PageLoader'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { journeyService } from '../../services'
import type { StageProps } from '../../types'
import { uploadHandler, viewDocument } from '../../upload'
import { BankAccountBlock } from './BankAccountBlock'
import { toBankRequest } from './mapper'
import { enabledBankTypes } from './rules'
import { bankDefaults, createBankSchema, type BankValues } from './schema'
import type { BankRequest } from './types'

const STAGE_KEY = 'bank-details'

/** Stage 11: bank accounts for each NRI account type, backed by one common bank letter. */
export default function BankStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const types = enabledBankTypes(journey.progress)
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<BankValues>(current, STAGE_KEY),
    readOnly,
  )

  const form = useForm<BankValues>({
    resolver: zodResolver(createBankSchema(types)),
    defaultValues: bankDefaults(types),
    values: saved.data ?? undefined,
  })
  const hasLetter = useWatch({ control: form.control, name: 'bankLetter' }) !== null

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: BankRequest) => journeyService.saveBank(journey, request),
    successMessage: 'All bank details saved successfully',
    viewData: () => form.getValues(),
  })

  if (saved.isLoading) return <PageLoader />

  const submit = form.handleSubmit(
    (values) =>
      save.mutate(
        toBankRequest(values, types, {
          formNo: journey.formNo,
          skRefNo: journey.skRefNo ?? '',
          empId: user.empId,
          pan: journey.progress.pan,
        }),
      ),
    () => toast.error('Some bank details need attention before saving.'),
  )

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="grid gap-6">
        <FileUpload
          name="bankLetter"
          label="Bank Letter"
          required
          description="One letter covers every account below. Upload it first."
          onUpload={uploadHandler('bankLetter', journey)}
          onView={viewDocument}
          disabled={readOnly}
          className="max-w-md"
        />

        {types.map((type) => (
          <section key={type.key} className="grid gap-4 rounded-lg border p-4" aria-labelledby={`bank-${type.key}`}>
            <h3 id={`bank-${type.key}`} className="font-medium">
              {type.title}
            </h3>
            <div className="grid gap-4 xl:grid-cols-2">
              {type.accounts.map((config, index) => (
                <BankAccountBlock
                  key={config.code}
                  journey={journey}
                  config={config}
                  siblingCode={type.accounts[1 - index]?.code}
                  // Accounts open once the bank letter is in; view mode keeps them closed.
                  disabled={readOnly || !hasLetter}
                />
              ))}
            </div>
          </section>
        ))}

        {!readOnly && (
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            {!hasLetter && <p className="text-sm text-muted-foreground">Upload the bank letter to begin</p>}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Submit All Bank Details'}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  )
}
