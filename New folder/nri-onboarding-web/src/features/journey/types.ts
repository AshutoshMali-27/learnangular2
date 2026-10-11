export type YesNo = 'Y' | 'N'

/** `NRIAccountOpening/GetInProcessData` → `data[0]`, in app naming. */
export interface JourneyProgress {
  /** Last stage saved on the server; 0 for a fresh form. */
  stageId: number
  pan: string
  holderCount: number
  nriCategory: string
  email: string
  /** Unknown ('') until the Extra Details stage is saved. */
  isBankAvailable: YesNo | ''
  nriTypes: { nrePis: boolean; nreNonPis: boolean; nroPis: boolean; nroNonPis: boolean }
}

/** Everything a stage needs to know about the form it is working on. */
export interface Journey {
  formNo: string
  /** FormEntryID. Null until the Inward stage has been saved. */
  skRefNo: string | null
  progress: JourneyProgress
}

/** Props every stage component receives from the stage route. */
export interface StageProps {
  journey: Journey
  /** Completed stages open in view mode. */
  readOnly: boolean
}

export interface PanDetails {
  /** dd/MM/yyyy, as returned by the PAN check. */
  dob: string
  nameAsPerPan: string
  /** PAN–Aadhaar seeding status. */
  seedingStatus: string
}

/** TAB e-sign record for a staff code: who they are and their stored signature. */
export interface EmployeeSign {
  name: string
  designation: string
  signature: { filePath: string; fileName: string }
}

/** One branch from the IFSC master. */
export interface BankBranch {
  ifsc: string
  branchId: string
  bankName: string
  branchName: string
}

/** Charge sheet of a brokerage scheme (`NRIAccountOpening/GetBrokerageData`). */
export type BrokerageCharges = Record<string, string>
