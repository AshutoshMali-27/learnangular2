import type { HolderAddressPayload } from '../address/types'

/** One joint holder in the backend's key names (Docs/UI/03-Holder.md §7). */
export interface HolderPayload {
  HolderType: string
  NamePrefix: string
  FirstName: string
  MiddleName: string
  LastName: string
  PAN: string
  DateOfBirth: string
  SmsTrading: string
  ResidentialStatusSubtype: string
  Gender: string
  MaritialStatus: string
  FatherHusbandFlag: string
  FatherHusbandName: string
  PrefixFatherHusbandName: string
  FatherHusbandFirstName: string
  FatherHusbandMiddleName: string
  FatherHusbandLastName: string
  MotherFirstName: string
  MotherMiddleName: string
  MotherLastName: string
  PrefixMaidenName: string
  MaidenFirstName: string
  MaidenMiddleName: string
  MaidenLastName: string
  EmailID: string
  EmailRelation: string
  MobileNumber: string
  MobileRelation: string
  OccupationTypeID: string
  IncomeSlabID: string
  PanLinkWithAadhaar: string
  FormerAliasesName: string
  Citizenship: string
}

/** Body of `Holder/SaveHolders`. */
export interface HolderRequest {
  FormEntryID: string
  EmployeeCode: string
  IsHolderAvailable: 'Y' | 'N'
  HolderDetails: HolderPayload[]
  AddressDetails: HolderAddressPayload[]
}
