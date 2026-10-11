/**
 * One holder's FATCA record. The backend model has about 110 string keys, most of them
 * entity / UBO fields that are always empty for individuals (Docs/API/FatcaController.md §6).
 */
export type FatcaPayload = Record<string, string>

/** Body of `Fatca/SaveFatcaData`. */
export interface FatcaRequest {
  FormEntryID: string
  EmployeeCode: string
  FatcaData: FatcaPayload[]
}
