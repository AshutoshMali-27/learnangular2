import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api'
import type { Journey } from '@/features/journey/types'
import { OBJECTION_QUERY_KEYS } from '../queryKeys'
import { objectionService } from '../services'
import type { FormObjections, ObjectionFilters, StageObjections } from '../types'

export const useObjectionForms = (filters: ObjectionFilters) =>
  useQuery({
    queryKey: OBJECTION_QUERY_KEYS.LIST(filters),
    queryFn: () => objectionService.getForms(filters),
  })

/** Objections of one form. Idle until the journey (and so the SK reference no) is known. */
export const useFormObjections = (journey: Journey | undefined) =>
  useQuery({
    queryKey: OBJECTION_QUERY_KEYS.FORM(journey?.formNo ?? ''),
    queryFn: () => objectionService.getObjections(journey!.formNo, journey!.skRefNo ?? ''),
    enabled: !!journey?.skRefNo,
  })

export const useCloseObjection = (journey: Journey) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (objectionId: string) =>
      objectionService.closeObjection(journey.formNo, journey.skRefNo ?? '', objectionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: OBJECTION_QUERY_KEYS.ALL })
      toast.success('Objection removed')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

const NONE: StageObjections = { remarks: '', objections: [] }

export const stageObjections = (all: FormObjections | undefined, stageId: number) => all?.[stageId] ?? NONE

export const hasObjections = ({ remarks, objections }: StageObjections) => Boolean(remarks) || objections.length > 0
