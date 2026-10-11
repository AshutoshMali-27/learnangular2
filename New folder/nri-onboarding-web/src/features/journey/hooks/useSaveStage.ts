import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import { alertDialog } from '@/lib/dialog-service'
import { useAppDispatch } from '@/store/hooks'
import { draftCleared } from '@/store/slices/draftsSlice'
import { journeyQuery } from './useJourney'
import { journeyMock } from '../journey.mock'
import { JOURNEY_QUERY_KEYS } from '../queryKeys'
import { useStageMode } from '../stageMode'
import { currentStagePath } from '../stages.config'
import type { Journey } from '../types'
import { draftKey } from './useStageStep'

interface SaveStageOptions<TPayload, TResult> {
  journey: Journey
  stageKey: string
  save: (payload: TPayload) => Promise<TResult>
  /** Toast shown after a successful save. */
  successMessage: string
  /** Shown as a dialog the user must acknowledge (e.g. the new reference number). */
  successDialog?: (result: TResult) => { title: string; description?: string }
  /** UI phase only: what to show when the saved stage is reopened read-only. */
  viewData?: () => unknown
}

/**
 * The save flow every stage shares: post, refresh the journey progress, drop the stage's
 * draft, tell the user, and move to whichever stage is now current (or back to the objection
 * hub when the stage was opened from there).
 */
export function useSaveStage<TPayload, TResult>({
  journey,
  stageKey,
  save,
  successMessage,
  successDialog,
  viewData,
}: SaveStageOptions<TPayload, TResult>) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { formNo } = journey
  const { returnPath } = useStageMode()

  return useMutation({
    mutationFn: save,
    onSuccess: async (result) => {
      if (viewData) journeyMock.rememberView(formNo, stageKey, viewData())
      queryClient.removeQueries({ queryKey: JOURNEY_QUERY_KEYS.STAGE_DATA(formNo, stageKey) })
      await queryClient.invalidateQueries({ queryKey: JOURNEY_QUERY_KEYS.JOURNEY(formNo), exact: true })
      const refreshed = await queryClient.ensureQueryData(journeyQuery(formNo))

      dispatch(draftCleared(draftKey(formNo, stageKey)))
      if (successDialog) await alertDialog(successDialog(result))
      else toast.success(successMessage)
      navigate(returnPath ?? currentStagePath(formNo, refreshed.progress))
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
