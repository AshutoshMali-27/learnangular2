import { useQuery } from '@tanstack/react-query'
import { JOURNEY_QUERY_KEYS } from '../queryKeys'
import { useStageMode } from '../stageMode'
import type { Journey } from '../types'

/**
 * Loads a stage's saved data as form values. Runs in view mode (`enabled`) and whenever the
 * stage is open for objection correction; a stage being filled for the first time starts from defaults.
 */
export function useStageData<TValues>(
  journey: Journey,
  stageKey: string,
  load: (journey: Journey) => Promise<TValues | null>,
  enabled: boolean,
) {
  const { isObjection } = useStageMode()

  return useQuery({
    queryKey: JOURNEY_QUERY_KEYS.STAGE_DATA(journey.formNo, stageKey),
    queryFn: () => load(journey),
    enabled: enabled || isObjection,
  })
}
