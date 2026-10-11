import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { JourneyProgress, StageProps } from './types'

export interface StageConfig {
  /** Backend stage id (`Stage_id`). 8 (Family Details) is disabled and not listed. */
  id: number
  /** URL segment and drafts key. */
  key: string
  title: string
  /** False when the form's data rules the stage out. */
  isAvailable: (progress: JourneyProgress) => boolean
  /** Undefined until the stage is built; the route shows a placeholder. */
  component?: LazyExoticComponent<ComponentType<StageProps>>
  /** Delivery phase, shown on the placeholder. */
  phase: number
}

const always = () => true

// The single description of the journey. The rail, the route guard and the "next stage"
// logic all read this array, so reordering or skipping a stage is a data change.
export const STAGES: StageConfig[] = [
  {
    id: 1,
    key: 'inward',
    title: 'Inward',
    isAvailable: always,
    component: lazy(() => import('./stages/inward/InwardStage')),
    phase: 3,
  },
  {
    id: 2,
    key: 'address',
    title: 'Address Details',
    isAvailable: always,
    component: lazy(() => import('./stages/address/AddressStage')),
    phase: 3,
  },
  {
    id: 3,
    key: 'holder',
    title: 'Holder',
    isAvailable: always,
    component: lazy(() => import('./stages/holder/HolderStage')),
    phase: 4,
  },
  {
    id: 4,
    key: 'fatca',
    title: 'FATCA',
    isAvailable: always,
    component: lazy(() => import('./stages/fatca/FatcaStage')),
    phase: 4,
  },
  {
    id: 5,
    key: 'proof',
    title: 'Proof',
    isAvailable: always,
    component: lazy(() => import('./stages/proof/ProofStage')),
    phase: 4,
  },
  {
    id: 6,
    key: 'nominee',
    title: 'Nominee',
    isAvailable: always,
    component: lazy(() => import('./stages/nominee/NomineeStage')),
    phase: 4,
  },
  {
    id: 7,
    key: 'miscellaneous',
    title: 'Miscellaneous',
    isAvailable: always,
    component: lazy(() => import('./stages/miscellaneous/MiscellaneousStage')),
    phase: 5,
  },
  {
    id: 9,
    key: 'extra-details',
    title: 'Extra Details',
    isAvailable: always,
    component: lazy(() => import('./stages/extra-details/ExtraDetailsStage')),
    phase: 5,
  },
  {
    id: 10,
    key: 'brokerage',
    title: 'Brokerage',
    isAvailable: always,
    component: lazy(() => import('./stages/brokerage/BrokerageStage')),
    phase: 5,
  },
  {
    id: 11,
    key: 'bank-details',
    title: 'Bank Details',
    // Offered unless Extra Details said the client has no bank account to link.
    isAvailable: (progress) => progress.isBankAvailable !== 'N',
    component: lazy(() => import('./stages/bank/BankStage')),
    phase: 5,
  },
]

export type StageStatus = 'completed' | 'current' | 'pending' | 'skipped'

/** The next stage the user has to fill, or null when the journey is finished. */
export const getCurrentStage = (progress: JourneyProgress): StageConfig | null =>
  STAGES.find((stage) => stage.id > progress.stageId && stage.isAvailable(progress)) ?? null

export function getStageStatus(stage: StageConfig, progress: JourneyProgress): StageStatus {
  if (!stage.isAvailable(progress)) return 'skipped'
  if (stage.id <= progress.stageId) return 'completed'
  return getCurrentStage(progress)?.id === stage.id ? 'current' : 'pending'
}

/** How far the form is: stages saved out of the stages this form needs. */
export function getStageCounts(progress: JourneyProgress) {
  const statuses = STAGES.map((stage) => getStageStatus(stage, progress))
  const required = statuses.filter((status) => status !== 'skipped').length
  const done = statuses.filter((status) => status === 'completed').length
  return { statuses, required, done, percent: required ? Math.round((done / required) * 100) : 0 }
}

export const journeyPath =(formNo: string, segment = '') =>
  `/journey/${encodeURIComponent(formNo)}${segment && `/${segment}`}`

/** Where the user should be for this form right now. */
export const currentStagePath = (formNo: string, progress: JourneyProgress) =>
  journeyPath(formNo, getCurrentStage(progress)?.key ?? 'complete')
