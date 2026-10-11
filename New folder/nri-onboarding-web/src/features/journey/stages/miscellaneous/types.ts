/** Body of `Miscellaneous/SavemiscDetails` (Docs/UI/07-Miscellaneous.md §4). */
export interface MiscRequest {
  FormEntryID: string
  EmployeeCode: string
  MiscDetails: Record<string, string>
  ConsentDetails: Record<string, string>
}
