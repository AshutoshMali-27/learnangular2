/** Body of `ExtraDetails/SaveExtraDetails` (Docs/UI/09-ExtraDetails.md §6). */
export interface ExtraDetailsRequest {
  FormEntryID: string
  EmployeeCode: string
  panno: string
  formno: string
  OtherDetails: Record<string, string>
}
