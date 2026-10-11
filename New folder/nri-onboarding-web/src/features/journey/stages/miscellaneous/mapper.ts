import { CONSENTS, OTHER_BROKER_DEALING, type Consent, type MiscValues } from './schema'
import type { MiscRequest } from './types'

// AMC, KRA and the other hidden MVC sections have no inputs; these are the values that page sent.
const MISC_DEFAULTS = {
  IsAMCApplicable: '',
  AMCTypeID: '0',
  AMCBankID: '0',
  AMCAmount: '0',
  AMCNumber: '0',
  AMCDate: '',
  IsDisputeWithOtherMember: '',
  IsDefaulterSuspendedBySEBI: '',
  ACHFlag: '',
  IsKRACompliant: '',
}

const answersFor = (target: Consent['target'], answers: Record<string, string>) =>
  Object.fromEntries(
    CONSENTS.filter((consent) => consent.target === target).map((consent) => [
      consent.payloadKey,
      answers[consent.name],
    ]),
  )

export const toMiscRequest = (values: MiscValues, context: { skRefNo: string; empId: string }): MiscRequest => ({
  FormEntryID: context.skRefNo,
  EmployeeCode: context.empId,
  MiscDetails: { ...MISC_DEFAULTS, ...answersFor('misc', values.answers) },
  ConsentDetails: {
    ...answersFor('consent', values.answers),
    // The name applies only when dealing through an authorised person was accepted.
    AuthorizedPersonName:
      values.answers[OTHER_BROKER_DEALING] === 'Y' ? values.authorizedPersonName.trim() : '',
    AuthorizedPersonAddress: '',
    NomineeDeclarationFlag: 'N',
  },
})
