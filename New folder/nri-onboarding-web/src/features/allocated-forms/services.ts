import type { Option } from '@/components/form'
import { operationsMock } from '@/mocks/operations.mock'

export const ALLOCATED_FORMS_QUERY_KEYS = {
  VERSIONS: ['allocated-forms', 'versions'],
  AVAILABLE: ['allocated-forms', 'available'],
} as const

// UI phase: resolves from the mock. Endpoints for API integration are named per function.
export const allocatedFormsService = {
  /** Home/getformversionmaster → `[{ DOC_VER_ID, DOC_VER_NAME }]`. */
  getVersions: (): Promise<Option[]> => operationsMock.getFormVersions(),

  /** NRIAccountOpening/getAvalaibleformnumbers → the branch's unused form numbers. */
  getAvailable: (): Promise<string[]> => operationsMock.getAvailableFormNumbers(),

  /** Home/CreateForm `{ documentVerId }` → `data.FormNumber`. */
  generate: (versionId: string): Promise<{ formNo: string }> => operationsMock.generateFormNumber(versionId),
}
