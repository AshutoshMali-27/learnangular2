export const JOURNEY_QUERY_KEYS = {
  ALL: ['journey'],
  JOURNEY: (formNo: string) => ['journey', formNo],
  STAGE_DATA: (formNo: string, stageKey: string) => ['journey', formNo, 'stage', stageKey],
} as const
