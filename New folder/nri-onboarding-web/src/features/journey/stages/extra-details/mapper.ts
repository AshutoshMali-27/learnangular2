import { isoToDisplay } from '@/lib/dates'
import type { ExtraDetailsValues } from './schema'
import type { ExtraDetailsRequest } from './types'

interface ExtraDetailsContext {
  formNo: string
  skRefNo: string
  empId: string
  branchId: string
  pan: string
}

/** Unselected masters are sent as 0, as the MVC page did. */
const idOrZero = (value: string) => value || '0'
/** The insider / sensitive-product radios send 1 or 0, and N when left unanswered. */
const flagOrN = (value: string) => value || 'N'

export function toExtraDetailsRequest(
  values: ExtraDetailsValues,
  context: ExtraDetailsContext,
): ExtraDetailsRequest {
  const { osv, interview, ipv } = values
  // Experience years are kept only when prior experience is declared.
  const years = (count: number) => String(values.hasPriorExperience ? count : 0)

  return {
    FormEntryID: context.skRefNo,
    EmployeeCode: context.empId,
    panno: context.pan,
    formno: context.formNo,
    OtherDetails: {
      is_bank_available: values.isBankAvailable,
      osv_staff_code: osv.staffCode.trim(),
      osv_name: osv.name.trim(),
      osv_desg: osv.designation.trim(),
      osv_date: isoToDisplay(osv.date),
      osv_sign_path: osv.signature?.filePath ?? '',
      interviewd_staff_code: interview.staffCode.trim(),
      interviewer_name: interview.name.trim(),
      interviewer_desg: interview.designation.trim(),
      interviewed_date: isoToDisplay(interview.date),
      interviewer_sign_path: interview.signature?.filePath ?? '',
      tipvempcode: ipv.staffCode.trim(),
      ipv_name: ipv.name.trim(),
      ipv_desg: ipv.designation.trim(),
      dipvverificationdt: isoToDisplay(ipv.date),
      ipv_sign_path: ipv.signature?.filePath ?? '',
      lipvbranchid: context.branchId,
      tipvverplace: values.interviewPlace.trim(),
      country_of_res: idOrZero(values.countryOfResidence),
      country_of_res_oth: '',
      country_src_income: idOrZero(values.countrySourceIncome),
      country_src_income_oth: '',
      invstmnt_thrgh_shrkhn: values.investmentThroughSharekhan,
      nature_of_bus_desc: values.natureOfBusiness.trim(),
      kmp_desg_id: idOrZero(values.kmpDesignationId),
      kmp_desg_desc: values.kmpDesignationDescription.trim(),
      access_insider_info: flagOrN(values.accessInsiderInfo),
      access_insider_info_rmrks: values.accessInsiderInfoRemark.trim(),
      usg_sensitv_prdcts_servcs: flagOrN(values.sensitiveProductServices),
      former_aliasesname: values.formerAliasName.trim(),
      citizenship: idOrZero(values.citizenship),
      factiva_upload_path: values.factiva?.filePath ?? '',
      is_prior_investment_expirience: values.hasPriorExperience ? 'Y' : 'N',
      investment_expirience_yrs: years(values.experienceYears),
      expirience_in_derivatives_yrs: years(values.derivativesYears),
      other_investment_fields_expirience_yrs: years(values.otherInvestmentYears),
    },
  }
}
