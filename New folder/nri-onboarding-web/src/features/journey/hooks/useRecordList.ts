import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { draftDataChanged, draftStepChanged } from '@/store/slices/draftsSlice'
import { draftKey } from './useStageStep'

/** Index of the record open in the editor, `'new'` for a record being added, null when closed. */
export type Editing = number | 'new' | null

interface ListDraft<T> {
  records: T[]
  editing: Editing
}

const EMPTY: ListDraft<never> = { records: [], editing: null }

/**
 * The records a stage collects before its single save (holders, FATCA records, documents,
 * nominees), plus which one is open in the editor. Lives in the drafts slice, so it survives
 * moving between stages and is dropped when the stage is saved.
 *
 * `listKey` separates several lists inside one stage (proof sections, NRE / NRO nominees).
 * `savedRecords` is what the list starts from until the user changes it (objection correction).
 */
export function useRecordList<T>(formNo: string, stageKey: string, listKey = 'records', savedRecords?: T[]) {
  const dispatch = useAppDispatch()
  const stage = `${draftKey(formNo, stageKey)}:${listKey}`
  const editorStage = `${stage}:editor`
  const stored = useAppSelector((state) => state.drafts[stage]?.data as ListDraft<T> | undefined)
  const draft: ListDraft<T> = stored ?? (savedRecords ? { records: savedRecords, editing: null } : EMPTY)

  const update = (next: ListDraft<T>) => dispatch(draftDataChanged({ stage, data: next }))
  const open = (editing: Editing) => {
    // Every time the editor opens, its wizard starts at the first step.
    dispatch(draftStepChanged({ stage: editorStage, step: 0 }))
    update({ ...draft, editing })
  }

  return {
    records: draft.records,
    editing: draft.editing,
    /** Drafts key of the editor's wizard position. */
    editorStage,
    openNew: () => open('new'),
    openAt: (index: number) => open(index),
    close: () => update({ ...draft, editing: null }),
    /** Adds the record, or replaces the one being edited, and closes the editor. */
    save: (record: T) =>
      update({
        records:
          typeof draft.editing === 'number'
            ? draft.records.map((item, index) => (index === draft.editing ? record : item))
            : [...draft.records, record],
        editing: null,
      }),
    removeAt: (index: number) =>
      update({ records: draft.records.filter((_, position) => position !== index), editing: null }),
  }
}

/** Wizard position of a record editor. */
export function useEditorStep(editorStage: string) {
  const dispatch = useAppDispatch()
  const step = useAppSelector((state) => state.drafts[editorStage]?.step ?? 0)
  return [step, (next: number) => dispatch(draftStepChanged({ stage: editorStage, step: next }))] as const
}
