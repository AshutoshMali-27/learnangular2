import { joinName } from '@/lib/names'
import { toHolderAddressPayload } from '../address/mapper'
import { holderTypeAt, type HolderRecord } from './schema'
import type { HolderPayload, HolderRequest } from './types'

// Values the MVC page always sent; the screen has no input for them.
const DEFAULT_OCCUPATION_TYPE_ID = '0'
const DEFAULT_INCOME_SLAB_ID = '5'
const NO_PREFIX = '0'

const toHolderPayload = (holder: HolderRecord, index: number): HolderPayload => ({
  HolderType: holderTypeAt(index),
  NamePrefix: holder.name.prefix,
  FirstName: holder.name.firstName,
  MiddleName: holder.name.middleName,
  LastName: holder.name.lastName,
  PAN: holder.pan,
  DateOfBirth: holder.dob,
  SmsTrading: 'Y',
  ResidentialStatusSubtype: holder.residentialStatus,
  Gender: holder.gender,
  MaritialStatus: holder.maritalStatus,
  FatherHusbandFlag: holder.fatherOrSpouse,
  FatherHusbandName: joinName(
    holder.fatherSpouseName.firstName,
    holder.fatherSpouseName.middleName,
    holder.fatherSpouseName.lastName,
  ),
  PrefixFatherHusbandName: holder.fatherSpouseName.prefix,
  FatherHusbandFirstName: holder.fatherSpouseName.firstName,
  FatherHusbandMiddleName: holder.fatherSpouseName.middleName,
  FatherHusbandLastName: holder.fatherSpouseName.lastName,
  MotherFirstName: holder.motherName.firstName,
  MotherMiddleName: holder.motherName.middleName,
  MotherLastName: holder.motherName.lastName,
  PrefixMaidenName: holder.maidenName.prefix || NO_PREFIX,
  MaidenFirstName: holder.maidenName.firstName,
  MaidenMiddleName: holder.maidenName.middleName,
  MaidenLastName: holder.maidenName.lastName,
  EmailID: holder.email,
  EmailRelation: holder.emailRelation,
  MobileNumber: holder.mobile,
  MobileRelation: holder.mobileRelation,
  OccupationTypeID: DEFAULT_OCCUPATION_TYPE_ID,
  IncomeSlabID: DEFAULT_INCOME_SLAB_ID,
  PanLinkWithAadhaar: holder.panAadhaarSeeding,
  FormerAliasesName: '',
  Citizenship: '',
})

/** An empty list is the "Skip Holder" request. */
export const toHolderRequest = (
  holders: HolderRecord[],
  context: { skRefNo: string; empId: string },
): HolderRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  IsHolderAvailable: holders.length > 0 ? 'Y' : 'N',
  HolderDetails: holders.map(toHolderPayload),
  AddressDetails: holders.map((holder, index) => toHolderAddressPayload(holder, holderTypeAt(index))),
})
