import { queryOptions, useQuery } from '@tanstack/react-query'
import { JOURNEY_QUERY_KEYS } from '../queryKeys'
import { journeyService } from '../services'

export const journeyQuery = (formNo: string) =>
  queryOptions({
    queryKey: JOURNEY_QUERY_KEYS.JOURNEY(formNo),
    queryFn: () => journeyService.getJourney(formNo),
    retry: false,
  })

/** Form validity, SK reference no and progress for one form. Drives the rail and the guard. */
export const useJourney = (formNo: string) => useQuery(journeyQuery(formNo))
