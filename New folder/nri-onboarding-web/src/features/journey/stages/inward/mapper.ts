import { joinName } from '@/lib/names'
import { defaultDpId, deriveProducts, hasNre, hasNro, NRI_TYPE } from './rules'
import type { InwardValues } from './schema'
import type { FormInwardPayload } from './types'

// The only place that knows the backend's FormInward key names.

const flag = (value: boolean) => (value ? 'Y' : 'N')

// The MVC page sent this constant as `loginId`; kept until the backend confirms what it expects.
const LEGACY_LOGIN_ID = '3442225'
// Billing scheme sent when BSDA is not opted (the BSDA option is hidden in the UI).
const DEFAULT_BILL_SCHEME_ID = '5'

interface InwardContext {
  formNo: string
  empId: string
  branchId: string
}

export function toInwardPayload(values: InwardValues, context: InwardContext): FormInwardPayload {
  const { nriTypes } = values
  const products = deriveProducts(nriTypes, values.fno)
  const linked = values.linkExistingDp === 'Y'
  const dpId = (selected: boolean, chosen: string) =>
    selected ? (linked ? chosen : defaultDpId(values.accountWith)) : ''
  const clientId = (selected: boolean, entered: string) => (selected && linked ? entered : '')

  return {
    formNo: context.formNo,
    panNo: values.pan,
    dob: values.dob,
    prefix: values.name.prefix,
    Fname: values.name.firstName,
    Mname: values.name.middleName,
    Lname: values.name.lastName,
    nameAsPerPan: values.nameAsPerPan,
    gender: values.gender,
    maritalStatus: values.maritalStatus,
    isFatherOrHusband: values.fatherOrSpouse,
    fatherHusbandName: joinName(
      values.fatherSpouseName.firstName,
      values.fatherSpouseName.middleName,
      values.fatherSpouseName.lastName,
    ),
    fatherHusbandFname: values.fatherSpouseName.firstName,
    fatherHusbandMname: values.fatherSpouseName.middleName,
    fatherHusbandLname: values.fatherSpouseName.lastName,
    residentalStatus: values.residentialStatus,
    nriCategory: values.nriWith,
    eqFlag: flag(products.equity),
    mfFlag: flag(products.mutualFunds),
    fnoFlag: flag(products.fno),
    currFlag: 'N',
    comFlag: 'N',
    nrePis: flag(nriTypes.includes(NRI_TYPE.NRE_PIS)),
    nreNonPis: flag(nriTypes.includes(NRI_TYPE.NRE_NONPIS)),
    nroPis: flag(nriTypes.includes(NRI_TYPE.NRO_PIS)),
    nroNonPis: flag(nriTypes.includes(NRI_TYPE.NRO_NONPIS)),
    poa: 'N',
    billSchId: DEFAULT_BILL_SCHEME_ID,
    accountType: values.accountType,
    contractNote: values.contractNote,
    accountWith: values.accountWith,
    isExistingDp: values.linkExistingDp,
    dpNreName: '',
    NreDPId: dpId(hasNre(nriTypes), values.nreDp.dpId),
    NreBeneficiaryId: clientId(hasNre(nriTypes), values.nreDp.clientId),
    dpNroName: '',
    NroDPId: dpId(hasNro(nriTypes), values.nroDp.dpId),
    NroBeneficiaryId: clientId(hasNro(nriTypes), values.nroDp.clientId),
    emailId: values.email,
    emailRel: values.emailRelation,
    mobileNo: values.mobile,
    mobileRel: values.mobileRelation,
    telephoneNo: values.telephone,
    telephoneNoISD: values.isdCode,
    branchCode: context.branchId,
    servingBranchCode: '',
    preferredBranchCode: values.preferredBranch,
    adminName: values.admin,
    leadId: values.leadId,
    salesExcode: values.salesCode,
    remiserCode: '',
    referingEmployeeCode: '',
    hniFlag: flag(values.hni),
    entryBy: context.empId,
    updateBy: context.empId,
    loginId: LEGACY_LOGIN_ID,
    enableACH: 'N',
    panlink_aadhar: values.panAadhaarSeeding,
    scancopy1: '',
  }
}

/** Saved form → form values, for view mode and objection correction. Saved checks count as verified. */
export function fromInwardPayload(saved: FormInwardPayload): InwardValues {
  const isOn = (value: string) => value === 'Y'
  const linked = saved.isExistingDp === 'Y'
  const nriTypes: string[] = [
    [saved.nrePis, NRI_TYPE.NRE_PIS],
    [saved.nreNonPis, NRI_TYPE.NRE_NONPIS],
    [saved.nroPis, NRI_TYPE.NRO_PIS],
    [saved.nroNonPis, NRI_TYPE.NRO_NONPIS],
  ].flatMap(([savedFlag, type]) => (isOn(savedFlag) ? [type] : []))

  return {
    pan: saved.panNo,
    panStatus: 'valid',
    dob: saved.dob,
    nameAsPerPan: saved.nameAsPerPan,
    panAadhaarSeeding: saved.panlink_aadhar,
    name: {
      prefix: saved.prefix,
      firstName: saved.Fname,
      middleName: saved.Mname,
      lastName: saved.Lname,
    },
    nriWith: saved.nriCategory,
    residentialStatus: saved.residentalStatus,
    gender: saved.gender,
    maritalStatus: saved.maritalStatus,
    fatherOrSpouse: saved.isFatherOrHusband,
    fatherSpouseName: {
      firstName: saved.fatherHusbandFname,
      middleName: saved.fatherHusbandMname,
      lastName: saved.fatherHusbandLname,
    },
    nriTypes,
    fno: isOn(saved.fnoFlag),
    accountType: saved.accountType,
    contractNote: saved.contractNote,
    accountWith: saved.accountWith,
    linkExistingDp: linked ? 'Y' : 'N',
    nreDp: { dpId: linked ? saved.NreDPId : '', clientId: saved.NreBeneficiaryId },
    nroDp: { dpId: linked ? saved.NroDPId : '', clientId: saved.NroBeneficiaryId },
    email: saved.emailId,
    emailStatus: 'valid',
    emailRelation: saved.emailRel,
    mobile: saved.mobileNo,
    mobileStatus: 'valid',
    mobileRelation: saved.mobileRel,
    isdCode: saved.telephoneNoISD,
    telephone: saved.telephoneNo,
    preferredBranch: saved.preferredBranchCode,
    admin: saved.adminName,
    leadId: saved.leadId,
    leadStatus: saved.leadId ? 'valid' : 'idle',
    salesCode: saved.salesExcode,
    salesStatus: saved.salesExcode ? 'valid' : 'idle',
    hni: isOn(saved.hniFlag),
  }
}
