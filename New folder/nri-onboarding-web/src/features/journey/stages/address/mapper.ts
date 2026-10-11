import type { AddressValues } from '@/components/shared/address/address.schema'
import type { AddressStageValues } from './schema'
import type { AddressPayload, AddressRequest, HolderAddressPayload } from './types'

// Address blocks are shared with the Holder and Nominee stages, so the block mappers are exported.

export const toAddressPayload = (address: AddressValues): AddressPayload => ({
  AddressLineOne: address.line1.trim(),
  AddressLineTwo: address.line2.trim(),
  AddressLineThree: address.line3.trim(),
  AddressLineFour: '',
  Landmark: address.landmark.trim(),
  CityID: address.cityId,
  StateID: address.stateId,
  District: address.district.trim(),
  CountryID: address.countryId,
  Pincode: address.pincode,
})

export const fromAddressPayload = (address: AddressPayload): AddressValues => ({
  line1: address.AddressLineOne ?? '',
  line2: address.AddressLineTwo ?? '',
  line3: address.AddressLineThree ?? '',
  landmark: address.Landmark ?? '',
  countryId: String(address.CountryID ?? ''),
  stateId: String(address.StateID ?? ''),
  cityId: String(address.CityID ?? ''),
  district: address.District ?? '',
  pincode: String(address.Pincode ?? ''),
})

/** "Same as permanent" is derived here instead of copying fields around in the form. */
export const toHolderAddressPayload = (
  values: AddressStageValues,
  holderType: string,
): HolderAddressPayload => ({
  HolderType: holderType,
  IsSameAddress: values.sameAsPermanent ? 'Y' : 'N',
  PermanentAddress: toAddressPayload(values.permanent),
  CorrespondenceAddress: toAddressPayload(
    values.sameAsPermanent ? values.permanent : values.correspondence,
  ),
})

export const fromHolderAddressPayload = (saved: HolderAddressPayload): AddressStageValues => ({
  permanent: fromAddressPayload(saved.PermanentAddress),
  sameAsPermanent: saved.IsSameAddress === 'Y',
  correspondence: fromAddressPayload(saved.CorrespondenceAddress),
})

const PRIMARY_HOLDER = 'TRD'

export const toAddressRequest = (
  values: AddressStageValues,
  context: { skRefNo: string; empId: string },
): AddressRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  AddressDetails: [toHolderAddressPayload(values, PRIMARY_HOLDER)],
})

/** Picks the primary client's address out of a saved request, if there is one. */
export const fromAddressRequest = (saved: AddressRequest): AddressStageValues | null => {
  const primary = saved.AddressDetails.find((item) => item.HolderType === PRIMARY_HOLDER)
  return primary ? fromHolderAddressPayload(primary) : null
}
