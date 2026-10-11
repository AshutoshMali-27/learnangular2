import { DescriptionList } from '@/components/shared/DescriptionList'
import { EntityCardList } from '@/components/shared/EntityCardList'
import { PageLoader } from '@/components/shared/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { confirm } from '@/lib/dialog-service'
import { joinName } from '@/lib/names'
import { RecordDialog } from '../../components/RecordDialog'
import { useRecordList } from '../../hooks/useRecordList'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { journeyService } from '../../services'
import type { StageProps } from '../../types'
import { HolderEditor } from './HolderEditor'
import { toHolderRequest } from './mapper'
import { holderLabelAt, holderTypeAt, MAX_HOLDERS, type HolderRecord, type HolderStageView } from './schema'
import type { HolderRequest } from './types'

const STAGE_KEY = 'holder'

/** Stage 3: up to two joint holders, collected as cards and saved in one call. */
export default function HolderStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<HolderStageView>(current, STAGE_KEY),
    readOnly,
  )
  const list = useRecordList<HolderRecord>(journey.formNo, STAGE_KEY, 'records', saved.data?.holders)
  const holders = readOnly ? (saved.data?.holders ?? []) : list.records

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: HolderRequest) => journeyService.saveHolders(journey, request),
    successMessage: 'Holder details saved successfully',
    viewData: (): HolderStageView => ({ holders }),
  })

  if (saved.isLoading) return <PageLoader />

  const submit = (records: HolderRecord[]) =>
    save.mutate(toHolderRequest(records, { skRefNo: journey.skRefNo ?? '', empId: user.empId }))

  const skip = async () => {
    const confirmed = await confirm({
      title: 'Continue without joint holders?',
      description: 'The account will be opened in the name of the primary applicant only.',
      confirmText: 'Skip Holder',
    })
    if (confirmed) submit([])
  }

  const remove = async (holder: HolderRecord, index: number) => {
    const confirmed = await confirm({
      title: 'Remove this holder?',
      description: `${joinName(holder.name.firstName, holder.name.lastName)} will be removed from the form.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) list.removeAt(index)
  }

  const editingIndex = typeof list.editing === 'number' ? list.editing : null
  const editingHolder = editingIndex === null ? undefined : holders[editingIndex]
  const editorTitle =
    editingIndex === null ? holderLabelAt(holders.length) : holderLabelAt(editingIndex)

  return (
    <div className="grid gap-6">
      <EntityCardList
        items={holders}
        max={MAX_HOLDERS}
        addLabel="Add Holder"
        editLabel={readOnly ? 'View' : 'Edit'}
        emptyText={readOnly ? 'This form has no joint holders.' : 'No joint holders added.'}
        getKey={(holder) => holder.pan}
        renderTitle={(holder) =>
          joinName(holder.name.prefix, holder.name.firstName, holder.name.middleName, holder.name.lastName)
        }
        renderBadge={(_, index) => <Badge>{holderTypeAt(index)}</Badge>}
        renderBody={(holder) => (
          <DescriptionList
            className="sm:grid-cols-1 lg:grid-cols-1"
            items={[
              { label: 'PAN', value: holder.pan },
              { label: 'Email', value: holder.email },
              { label: 'Mobile', value: holder.mobile },
            ]}
          />
        )}
        onAdd={readOnly ? undefined : list.openNew}
        onEdit={(_, index) => list.openAt(index)}
        onDelete={readOnly ? undefined : remove}
      />

      {!readOnly && (
        <div className="flex justify-end gap-2 border-t pt-4">
          {holders.length === 0 ? (
            <Button variant="outline" onClick={skip} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Skip Holder'}
            </Button>
          ) : (
            <Button onClick={() => submit(holders)} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save holder details'}
            </Button>
          )}
        </div>
      )}

      <RecordDialog open={list.editing !== null} title={editorTitle} onClose={list.close}>
        <HolderEditor
          journey={journey}
          editorStage={list.editorStage}
          initial={editingHolder}
          others={holders.filter((_, index) => index !== editingIndex)}
          readOnly={readOnly}
          onSave={list.save}
        />
      </RecordDialog>
    </div>
  )
}
