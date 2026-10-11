/** One address block in the backend's key names (Docs/UI/02-Address.md §6). */
export interface AddressPayload {
  AddressLineOne: string
  AddressLineTwo: string
  AddressLineThree: string
  AddressLineFour: string
  Landmark: string
  CityID: string
  StateID: string
  District: string
  CountryID: string
  Pincode: string
}

export interface HolderAddressPayload {
  /** `TRD` = primary client, `2ND` / `3RD` = joint holders. */
  HolderType: string
  IsSameAddress: 'Y' | 'N'
  PermanentAddress: AddressPayload
  CorrespondenceAddress: AddressPayload
}

/** Body of `NRIAccountOpening/SaveAddress`. */
export interface AddressRequest {
  FormEntryID: string
  EmployeeCode: string
  AddressDetails: HolderAddressPayload[]
}
