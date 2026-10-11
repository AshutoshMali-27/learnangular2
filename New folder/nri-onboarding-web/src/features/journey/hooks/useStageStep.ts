import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { draftStepChanged } from '@/store/slices/draftsSlice'

export const draftKey = (formNo: string, stageKey: string) => `${formNo}:${stageKey}`

/** A stage's wizard position, kept in the drafts slice so it survives moving around the app. */
export function useStageStep(formNo: string, stageKey: string) {
  const dispatch = useAppDispatch()
  const stage = draftKey(formNo, stageKey)
  const step = useAppSelector((state) => state.drafts[stage]?.step ?? 0)
  const setStep = (next: number) => dispatch(draftStepChanged({ stage, step: next }))
  return [step, setStep] as const
}
