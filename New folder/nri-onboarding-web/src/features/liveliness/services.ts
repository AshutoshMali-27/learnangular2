import type { StandardFilters } from '@/components/shared/StandardFilterFields'
import { operationsMock } from '@/mocks/operations.mock'

/** One holder whose liveliness check is pending (`Getrecordforsendliveproof`), in app naming. */
export interface LivelinessRow {
  formNo: string
  skRefNo: string
  pan: string
  /** `TRD` (primary), `2ND` or `3RD`. */
  holderType: string
  clientName: string
  email: string
  mobile: string
  mailLastSentOn: string
  isEmailVerified: boolean
  canSendMail: boolean
}

export const LIVELINESS_QUERY_KEYS = {
  ALL: ['liveliness'],
  PENDING: (filters: StandardFilters) => ['liveliness', 'pending', filters],
} as const

const PRIMARY = 'TRD'

// Row rules as pure functions (Docs/UI/19-SendLivelinessNotification.md).
/** Only the primary holder's email has to be verified; joint holders count as verified. */
export const isVerified = (row: LivelinessRow) => row.holderType !== PRIMARY || row.isEmailVerified

export type Notification = 'liveliness' | 'livelinessBlocked' | 'emailVerification'

/** Which mail can be sent to this holder now. */
export const notificationFor = (row: LivelinessRow): Notification =>
  !isVerified(row) ? 'emailVerification' : row.canSendMail ? 'liveliness' : 'livelinessBlocked'

const HOLDER_ORDER = [PRIMARY, '2ND', '3RD']

/** Rows grouped by form, forms in number order, holders primary first. */
export function groupByForm(rows: LivelinessRow[]) {
  const groups = new Map<string, LivelinessRow[]>()
  for (const row of rows) groups.set(row.formNo, [...(groups.get(row.formNo) ?? []), row])
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([formNo, holders]) => ({
      formNo,
      holders: holders.sort((a, b) => HOLDER_ORDER.indexOf(a.holderType) - HOLDER_ORDER.indexOf(b.holderType)),
    }))
}

// UI phase: resolves from the mock. Endpoints for API integration are named per function.
export const livelinessService = {
  /** NRIAccountOpening/Getrecordforsendliveproof. */
  getPending: (filters: StandardFilters): Promise<LivelinessRow[]> => operationsMock.getLivelinessPending(filters),

  /** NRIAccountOpening/SendLivelinessMail `{ FormEntryID, holderType }`. */
  sendLivelinessMail: (row: LivelinessRow): Promise<unknown> =>
    operationsMock.sendLivelinessMail(row.formNo, row.holderType),

  /** NRIAccountOpening/SendVerificationMail (form fields `formNo`, `pan`, `email`). */
  sendVerificationMail: (row: LivelinessRow): Promise<unknown> =>
    operationsMock.sendVerificationMail(row.formNo, row.pan),
}
