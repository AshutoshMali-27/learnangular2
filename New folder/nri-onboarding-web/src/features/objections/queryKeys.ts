import type { ObjectionFilters } from './types'

export const OBJECTION_QUERY_KEYS = {
  ALL: ['objections'],
  LIST: (filters: ObjectionFilters) => ['objections', 'list', filters],
  FORM: (formNo: string) => ['objections', 'form', formNo],
} as const
