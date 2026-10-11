import { CircleCheck } from 'lucide-react'
import type { Option } from '@/components/form'
import { EntityCardList } from '@/components/shared/EntityCardList'
import { PageLoader } from '@/components/shared/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSessionUser } from '@/features/auth'
import { useDocumentTypes, type DocumentTypeMeta } from '@/features/masters'
import { confirm } from '@/lib/dialog-service'
import { RecordDialog } from '../../components/RecordDialog'
import { useRecordList } from '../../hooks/useRecordList'
import { useSaveStage } from '../../hooks/useSaveStage'
import { useStageData } from '../../hooks/useStageData'
import { journeyService } from '../../services'
import type { Journey, StageProps } from '../../types'
import { DocumentForm } from './DocumentForm'
import { toProofRequest } from './mapper'
import { categoryLabel, missingDocuments, proofSections, type ProofSection } from './rules'
import type { ProofDocument, ProofStageView } from './schema'
import type { ProofRequest } from './types'

const STAGE_KEY = 'proof'

interface SectionProps {
  journey: Journey
  section: ProofSection
  docTypes: Option<DocumentTypeMeta>[]
  /** Saved documents in view mode; the draft list is used otherwise. */
  savedDocuments?: ProofDocument[]
  /** Saved documents the draft list starts from when correcting objections. */
  seedDocuments?: ProofDocument[]
  readOnly: boolean
}

/** Draft documents of one holder. A hook so the stage can read every section's list for the save. */
const useSectionDocuments = (journey: Journey, holderType: string, saved?: ProofDocument[]) =>
  useRecordList<ProofDocument>(journey.formNo, STAGE_KEY, holderType, saved)

function ProofSectionCard({ journey, section, docTypes, savedDocuments, seedDocuments, readOnly }: SectionProps) {
  const list = useSectionDocuments(journey, section.holderType, seedDocuments)
  const documents = savedDocuments ?? list.records
  const missing = missingDocuments(section, documents)

  const remove = async (document: ProofDocument, index: number) => {
    const confirmed = await confirm({
      title: 'Remove this document?',
      description: `${document.docTypeName} will be removed from ${section.title}.`,
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (confirmed) list.removeAt(index)
  }

  return (
    <section className="grid gap-4 rounded-lg border p-4" aria-labelledby={`proof-${section.holderType}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`proof-${section.holderType}`} className="font-medium">
          {section.title}
        </h3>
        {missing.length === 0 ? (
          <Badge variant="secondary">
            <CircleCheck />
            Complete
          </Badge>
        ) : (
          <Badge variant="outline">Still needed: {missing.join(', ')}</Badge>
        )}
      </div>

      <EntityCardList
        items={documents}
        addLabel="Add Document"
        editLabel={readOnly ? 'View' : 'Edit'}
        emptyText="No documents added."
        getKey={(document, index) => `${document.docTypeId}-${index}`}
        renderTitle={(document) => document.docTypeName}
        renderBody={(document) => (
          <div className="grid gap-2">
            {document.number && <p>{document.number}</p>}
            <div className="flex flex-wrap gap-1">
              {document.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {categoryLabel(category)}
                </Badge>
              ))}
            </div>
            <p className="truncate text-xs">{document.file?.fileName}</p>
          </div>
        )}
        onAdd={readOnly ? undefined : list.openNew}
        onEdit={(_, index) => list.openAt(index)}
        onDelete={readOnly ? undefined : remove}
      />

      <RecordDialog
        open={list.editing !== null}
        title={`${section.title}: ${typeof list.editing === 'number' ? 'document' : 'add document'}`}
        description="The file is uploaded as soon as you choose it."
        onClose={list.close}
      >
        <DocumentForm
          journey={journey}
          docTypes={docTypes}
          initial={typeof list.editing === 'number' ? documents[list.editing] : undefined}
          readOnly={readOnly}
          onSave={list.save}
          onCancel={list.close}
        />
      </RecordDialog>
    </section>
  )
}

/** Stage 5: KYC documents for the client and each joint holder, saved in one call. */
export default function ProofStage({ journey, readOnly }: StageProps) {
  const user = useSessionUser()
  const docTypes = useDocumentTypes()
  const saved = useStageData(
    journey,
    STAGE_KEY,
    (current) => journeyService.getStageView<ProofStageView>(current, STAGE_KEY),
    readOnly,
  )

  // A form has at most three holders, so the three lists are read unconditionally.
  const client = useSectionDocuments(journey, 'TRD', saved.data?.TRD).records
  const second = useSectionDocuments(journey, '2ND', saved.data?.['2ND']).records
  const third = useSectionDocuments(journey, '3RD', saved.data?.['3RD']).records
  const sections = proofSections(journey.progress.holderCount)
  const drafts: ProofStageView = { TRD: client, '2ND': second, '3RD': third }
  const documents: ProofStageView = Object.fromEntries(
    sections.map((section) => [
      section.holderType,
      readOnly ? (saved.data?.[section.holderType] ?? []) : drafts[section.holderType],
    ]),
  )
  const incomplete = sections.filter((section) => missingDocuments(section, documents[section.holderType]).length > 0)

  const save = useSaveStage({
    journey,
    stageKey: STAGE_KEY,
    save: (request: ProofRequest) => journeyService.saveProof(journey, request),
    successMessage: 'All proof details saved successfully',
    viewData: (): ProofStageView => documents,
  })

  if (docTypes.isPending || saved.isLoading) return <PageLoader />

  return (
    <div className="grid gap-6">
      {sections.map((section) => (
        <ProofSectionCard
          key={section.holderType}
          journey={journey}
          section={section}
          docTypes={docTypes.data ?? []}
          savedDocuments={readOnly ? documents[section.holderType] : undefined}
          seedDocuments={saved.data?.[section.holderType]}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          {incomplete.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Complete {incomplete.map((section) => section.title).join(', ')} to submit
            </p>
          )}
          <Button
            disabled={incomplete.length > 0 || save.isPending}
            onClick={() =>
              save.mutate(
                toProofRequest(documents, {
                  formNo: journey.formNo,
                  skRefNo: journey.skRefNo ?? '',
                  empId: user.empId,
                  pan: journey.progress.pan,
                }),
              )
            }
          >
            {save.isPending ? 'Saving…' : 'Submit All Proof'}
          </Button>
        </div>
      )}
    </div>
  )
}
