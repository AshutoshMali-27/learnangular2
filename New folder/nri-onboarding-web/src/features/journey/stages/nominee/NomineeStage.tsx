import { useId } from 'react'
import { DescriptionList } from '@/components/shared/DescriptionList'
import { EntityCardList } from '@/components/shared/EntityCardList'
import { PageLoader } from '@/components/shared/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSessionUser } from '@/features/auth'
import { confirm } from '@/lib/dialog-service'
import { joinName } from '@/lib/names'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { draftDataChanged } from '@/store/slices/draftsSlice'
import { RecordDialog } from '../../components/RecordDialog'
import { useRecordList } from '../../hooks/useRecordList'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { draftKey } from '../../hooks/useStageStep'
import { journeyService } from '../../services'
import type { Journey, StageProps } from '../../types'
import { toNomineeRequest, toNoNomineeRequest } from './mapper'
import { NomineeEditor } from './NomineeEditor'
import {
  availableAccounts,
  isMinor,
  MAX_NOMINEES_PER_ACCOUNT,
  shareTotal,
  type NomineeAccount,
} from './rules'
import type { NomineeRecord, NomineeStageView } from './schema'
import type { NomineeRequest } from './types'

const STAGE_KEY = 'nominee'

type OptIn = NomineeStageView['optIn']

const useAccountNominees = (journey: Journey, account: NomineeAccount, saved?: NomineeRecord[]) =>
  useRecordList<NomineeRecord>(journey.formNo, STAGE_KEY, account, saved)

interface AccountSectionProps {
  journey: Journey
  account: NomineeAccount
  savedNominees?: NomineeRecord[]
  /** Saved nominees the draft list starts from when correcting objections. */
  seedNominees?: NomineeRecord[]
  readOnly: boolean
}

function AccountSection({ journey, account, savedNominees, seedNominees, readOnly }: AccountSectionProps) {
  const list = useAccountNominees(journey, account, seedNominees)
  const nominees = savedNominees ?? list.records
  const total = shareTotal(nominees)
  const editingIndex = typeof list.editing === 'number' ? list.editing : null

  const remove = async (nominee: NomineeRecord, index: number) => {
    const confirmed = await confirm({
      title: 'Remove this nominee?',
      description: `${joinName(nominee.name.firstName, nominee.name.lastName)} will be removed from the ${account} account.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) list.removeAt(index)
  }

  return (
    <section className="grid gap-4 rounded-lg border p-4" aria-labelledby={`nominee-${account}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`nominee-${account}`} className="font-medium">
          {account} Account
        </h3>
        <Badge variant={total === 100 ? 'secondary' : 'outline'}>
          {total === 100 ? 'Complete · 100% allocated' : `${total}% of 100% allocated`}
        </Badge>
      </div>

      <EntityCardList
        items={nominees}
        max={MAX_NOMINEES_PER_ACCOUNT}
        canAdd={total < 100}
        addLabel="Add Nominee"
        editLabel={readOnly ? 'View' : 'Edit'}
        emptyText="No nominees added for this account."
        getKey={(nominee) => nominee.proofNumber}
        renderTitle={(nominee) =>
          joinName(nominee.name.prefix, nominee.name.firstName, nominee.name.middleName, nominee.name.lastName)
        }
        renderBadge={(nominee) => <Badge>{nominee.share}%</Badge>}
        renderBody={(nominee, index) => (
          <DescriptionList
            className="sm:grid-cols-1 lg:grid-cols-1"
            items={[
              { label: 'Nominee', value: `${account} Nominee ${index + 1}` },
              { label: 'Proof number', value: nominee.proofNumber },
              { label: 'Guardian', value: isMinor(nominee.dob) ? 'Yes (minor)' : 'No' },
            ]}
          />
        )}
        onAdd={readOnly ? undefined : list.openNew}
        onEdit={(_, index) => list.openAt(index)}
        onDelete={readOnly ? undefined : remove}
      />

      <RecordDialog
        open={list.editing !== null}
        title={`${account} nominee ${(editingIndex ?? nominees.length) + 1}`}
        onClose={list.close}
      >
        <NomineeEditor
          journey={journey}
          account={account}
          editorStage={list.editorStage}
          initial={editingIndex === null ? undefined : nominees[editingIndex]}
          others={nominees.filter((_, index) => index !== editingIndex)}
          readOnly={readOnly}
          onSave={list.save}
        />
      </RecordDialog>
    </section>
  )
}

/** Stage 6: opt in or out of nomination; when in, nominees per account must total 100%. */
export default function NomineeStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const dispatch = useAppDispatch()
  const optInId = useId()
  const stage = draftKey(journey.formNo, STAGE_KEY)
  const draftOptIn = useAppSelector((state) => (state.drafts[stage]?.data as OptIn | undefined) ?? '')
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<NomineeStageView>(current, STAGE_KEY),
    readOnly,
  )

  const accounts = availableAccounts(journey.progress)
  const nre = useAccountNominees(journey, 'NRE', saved.data?.nominees.NRE).records
  const nro = useAccountNominees(journey, 'NRO', saved.data?.nominees.NRO).records
  const drafts: Record<NomineeAccount, NomineeRecord[]> = { NRE: nre, NRO: nro }

  // Until the user answers again, an objection correction keeps the saved answer.
  const optIn: OptIn = readOnly ? (saved.data?.optIn ?? '') : draftOptIn || (saved.data?.optIn ?? '')
  const nominees = Object.fromEntries(
    accounts.map((account) => [account, readOnly ? (saved.data?.nominees[account] ?? []) : drafts[account]]),
  ) as Partial<Record<NomineeAccount, NomineeRecord[]>>
  const unallocated = accounts.filter((account) => shareTotal(nominees[account] ?? []) !== 100)

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: NomineeRequest) => journeyService.saveNominee(journey, request),
    successMessage: 'Nominee details saved successfully',
    viewData: (): NomineeStageView => ({ optIn, nominees: optIn === 'Y' ? nominees : {} }),
  })

  if (saved.isLoading) return <PageLoader />

  const context = { skRefNo: journey.skRefNo ?? '', empId: user.empId }

  const optOut = async () => {
    const confirmed = await confirm({
      title: 'Continue without a nominee?',
      description: 'The client is opting out of nomination for this account.',
      confirmText: 'Save without nominee',
    })
    if (confirmed) save.mutate(toNoNomineeRequest(context))
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <span id={optInId} className="text-sm font-medium">
          Do you want to add a nominee?
        </span>
        <RadioGroup
          value={optIn}
          disabled={readOnly}
          aria-labelledby={optInId}
          className="flex gap-5"
          onValueChange={(value) => dispatch(draftDataChanged({ stage, data: value }))}
        >
          {(['Y', 'N'] as const).map((value) => (
            <div key={value} className="flex items-center gap-2">
              <RadioGroupItem id={`${optInId}-${value}`} value={value} />
              <Label htmlFor={`${optInId}-${value}`} className="font-normal">
                {value === 'Y' ? 'Yes' : 'No'}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {optIn === 'Y' &&
        accounts.map((account) => (
          <AccountSection
            key={account}
            journey={journey}
            account={account}
            savedNominees={readOnly ? nominees[account] : undefined}
            seedNominees={saved.data?.nominees[account]}
            readOnly={readOnly}
          />
        ))}

      {!readOnly && optIn === 'N' && (
        <div className="flex justify-end border-t pt-4">
          <Button onClick={optOut} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save without nominee'}
          </Button>
        </div>
      )}

      {!readOnly && optIn === 'Y' && (
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          {unallocated.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Allocate exactly 100% for {unallocated.join(' and ')} to submit
            </p>
          )}
          <Button
            disabled={unallocated.length > 0 || save.isPending}
            onClick={() =>
              save.mutate(
                toNomineeRequest(nominees, { ...context, formNo: journey.formNo, pan: journey.progress.pan }),
              )
            }
          >
            {save.isPending ? 'Saving…' : 'Final Submit'}
          </Button>
        </div>
      )}
    </div>
  )
}
