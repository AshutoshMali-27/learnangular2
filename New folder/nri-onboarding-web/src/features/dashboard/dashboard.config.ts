import {
  FileSearch,
  FileSignature,
  FileStack,
  FileUp,
  FileWarning,
  MailCheck,
  MessageSquareWarning,
  PackageCheck,
  Plus,
  ScanFace,
  Send,
  Truck,
  UserPen,
  type LucideIcon,
} from 'lucide-react'

export interface Queue {
  label: string
  countKey: string
  icon: LucideIcon
  /** Screen where this queue is worked. */
  to: string
}

export interface Phase {
  title: string
  hint: string
  icon: LucideIcon
  queues: Queue[]
}

// The dashboard as data (Docs/UI/24-Dashboard.md), ordered the way a form travels from
// data entry to courier. Every dashboard layout renders this same list. The courier tiles
// had no link in MVC; here they open the Courier screen on the matching list.
export const PHASES: Phase[] = [
  {
    title: 'Data Collection',
    hint: 'Forms being filled and corrected',
    icon: UserPen,
    queues: [
      { label: 'Data Collection Pending', countKey: 'WaitingForDataFormsCount', icon: UserPen, to: '/reports/in-process' },
      { label: 'Data Objections', countKey: 'DataObjections', icon: MessageSquareWarning, to: '/objections' },
    ],
  },
  {
    title: 'Verification',
    hint: 'Liveliness and email checks',
    icon: ScanFace,
    queues: [
      { label: 'Liveliness Pending', countKey: 'LivelinessPending', icon: ScanFace, to: '/liveliness/send' },
      { label: 'Email Verification Pending', countKey: 'EmailVerificationPending', icon: MailCheck, to: '/liveliness/send' },
    ],
  },
  {
    title: 'Documents',
    hint: 'Signed and bank PDFs',
    icon: FileStack,
    queues: [
      { label: 'Signed PDF Upload', countKey: 'SignedPDFUploadPending', icon: FileSignature, to: '/pdf-upload' },
      { label: 'Bank PDF Upload', countKey: 'BankPDFUploadPending', icon: FileUp, to: '/pdf-upload' },
      { label: 'PDF Objections', countKey: 'PDFObjections', icon: FileWarning, to: '/pdf-upload' },
    ],
  },
  {
    title: 'Courier',
    hint: 'Physical forms in transit',
    icon: Truck,
    queues: [
      { label: 'Pending Courier from Client', countKey: 'CourierFromClientPending', icon: PackageCheck, to: '/courier' },
      { label: 'Courier to be sent to HO', countKey: 'CourierToBeSentToHOPending', icon: Send, to: '/courier?courierType=ho' },
    ],
  },
]

export const SHORTCUTS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Add New Account', to: '/journey', icon: Plus },
  { label: 'Account Status Report', to: '/reports/account-status', icon: FileSearch },
  { label: 'Send Liveliness Link', to: '/liveliness/send', icon: ScanFace },
]

/** A count as shown on screen: a dash until it has loaded. */
export const show = (count: number | undefined) => count ?? '–'

/** Bar width for a count against the largest one; a non-zero count never disappears. */
export const share = (count: number | undefined, max: number) => (count && max ? Math.max((count / max) * 100, 4) : 0)

// Phases are ordered, so they share one hue stepped light to dark instead of four colours.
export const PHASE_TINT = ['opacity-40', 'opacity-60', 'opacity-80', 'opacity-100']
