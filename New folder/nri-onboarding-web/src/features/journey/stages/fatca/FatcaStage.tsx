import { DescriptionList } from '@/components/shared/DescriptionList'
import { EntityCardList } from '@/components/shared/EntityCardList'
import { PageLoader } from '@/components/shared/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { useCountries, useIncomeSlabs } from '@/features/masters'
import { confirm } from '@/lib/dialog-service'
import { RecordDialog } from '../../components/RecordDialog'
import { useRecordList } from '../../hooks/useRecordList'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { journeyService } from '../../services'
import type { StageProps } from '../../types'
import { FatcaEditor } from './FatcaEditor'
import { toFatcaRequest } from './mapper'
import { fatcaHolderLabelAt, fatcaHolderTypeAt } from './rules'
import type { FatcaRecord, FatcaStageView } from './schema'
import type { FatcaRequest } from './types'

const STAGE_KEY = 'fatca'

/** Stage 4: one FATCA / CRS declaration per holder on the form. */
export default function FatcaStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<FatcaStageView>(current, STAGE_KEY),
    readOnly,
  )
  const list = useRecordList<FatcaRecord>(journey.formNo, STAGE_KEY, 'records', saved.data?.records)
  const countries = useCountries()
  const incomeSlabs = useIncomeSlabs()

  const records = readOnly ? (saved.data?.records ?? []) : list.records
  const required = journey.progress.holderCount
  const labelOf = (options: { value: string; label: string }[] | undefined, value: string) =>
    options?.find((option) => option.value === value)?.label ?? value

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: FatcaRequest) => journeyService.saveFatca(journey, request),
    successMessage: 'FATCA details saved successfully',
    viewData: (): FatcaStageView => ({ records }),
  })

  if (saved.isLoading) return <PageLoader />

  // Holder type follows position, so only the last record can be removed without shifting the others.
  const removeLast = async () => {
    const confirmed = await confirm({
      title: 'Remove this FATCA record?',
      description: `The declaration for the ${fatcaHolderLabelAt(records.length - 1).toLowerCase()} will be removed.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) list.removeAt(records.length - 1)
  }

  const editingIndex = typeof list.editing === 'number' ? list.editing : records.length

  return (
    <div className="grid gap-6">
      <p className="text-sm text-muted-foreground">
        This form has {required} {required === 1 ? 'holder' : 'holders'}. Add one declaration for each,
        starting with the primary applicant.
      </p>

      <EntityCardList
        items={records}
        max={required}
        addLabel={`Add FATCA for ${fatcaHolderLabelAt(records.length).toLowerCase()}`}
        editLabel={readOnly ? 'View' : 'Edit'}
        emptyText="No FATCA declarations added."
        getKey={(_, index) => fatcaHolderTypeAt(index)}
        renderTitle={(_, index) => fatcaHolderLabelAt(index)}
        renderBadge={(_, index) => <Badge>{fatcaHolderTypeAt(index)}</Badge>}
        renderBody={(record) => (
          <DescriptionList
            className="sm:grid-cols-1 lg:grid-cols-1"
            items={[
              { label: 'Country of residence', value: labelOf(countries.data, record.countryOfResidence) },
              { label: 'Income slab', value: labelOf(incomeSlabs.data, record.incomeSlab) },
              { label: 'Net worth', value: record.netWorth },
            ]}
          />
        )}
        onAdd={readOnly ? undefined : list.openNew}
        onEdit={(_, index) => list.openAt(index)}
        onDelete={readOnly ? undefined : removeLast}
        canDelete={(_, index) => index === records.length - 1}
      />

      {!readOnly && (
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          {records.length < required && (
            <p className="text-sm text-muted-foreground">
              {required - records.length} more {required - records.length === 1 ? 'declaration' : 'declarations'} needed
            </p>
          )}
          <Button
            disabled={records.length !== required || save.isPending}
            onClick={() =>
              save.mutate(toFatcaRequest(records, { skRefNo: journey.skRefNo ?? '', empId: user.empId }))
            }
          >
            {save.isPending ? 'Saving…' : 'Submit'}
          </Button>
        </div>
      )}

      <RecordDialog
        open={list.editing !== null}
        title={`FATCA: ${fatcaHolderLabelAt(editingIndex)}`}
        onClose={list.close}
      >
        <FatcaEditor
          journey={journey}
          editorStage={list.editorStage}
          index={editingIndex}
          initial={typeof list.editing === 'number' ? records[list.editing] : undefined}
          readOnly={readOnly}
          onSave={list.save}
        />
      </RecordDialog>
    </div>
  )
}
