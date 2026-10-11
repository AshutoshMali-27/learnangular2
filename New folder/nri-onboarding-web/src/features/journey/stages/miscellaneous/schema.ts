import { z } from 'zod'

export interface Consent {
  /** Form field name. */
  name: string
  label: string
  /** Backend key the Y / N answer is sent under. */
  payloadKey: string
  /** `misc` answers go in MiscDetails, the rest in ConsentDetails. */
  target: 'misc' | 'consent'
}

const consent = (name: string, label: string, payloadKey: string, target: Consent['target'] = 'consent'): Consent => ({
  name,
  label,
  payloadKey,
  target,
})

// The stage is this list: adding or rewording a declaration is a one-line change.
// Several "other stock broker" answers are sent under keys named like data values; that is
// how the backend model is, not a mistake here.
export const CONSENTS: Consent[] = [
  consent('negativeList', 'Negative list declaration', 'IsInNegativeList', 'misc'),
  consent('autoCredit', 'Consent to receive credits automatically into my/our account', 'ConsentForAutoCredit'),
  consent('standingPoa', 'Consent to Standing Instruction POA', 'ConsentForStandingPOA'),
  consent(
    'holdingStatement',
    'Consent to send ElecTrans-cum-Holding statement',
    'ConsentToSendHoldingStatementOnAuthorizedEmail',
  ),
  consent('shareEmailRta', 'Consent to share email ID with RTA', 'ConsentToShareEmailRTA'),
  consent('internetTrading', 'Consent to internet trading / wireless technology', 'ConsentForInternetTrading'),
  consent('marginTrading', 'Consent to Exchange Margin Trading', 'ConsentForExchangeMarginTrading'),
  consent(
    'annualReport',
    'Consent to receiving Annual Reports & Statement of Accounts',
    'ConsentToRecieveAnnualReport',
  ),
  consent(
    'otherBrokerDealing',
    'Consent to dealing through authorised person and other stock broker',
    'ConsentForOtherBrokerDealing',
  ),
  consent('otherBrokerRegNo', 'Other stock broker NSE registration no.', 'ConsentForOtherBrokerRegNo'),
  consent('otherBrokerTel', 'Other stock broker telephone no.', 'OtherBrokerTelephoneNumber'),
  consent('otherBrokerFax', 'Other stock broker fax', 'OtherBrokerFaxNumber'),
  consent('otherBrokerWebsite', 'Other stock broker website', 'OtherBrokerWebsiteURL'),
  consent(
    'pledgeAcceptance',
    'Consent to accept all pledge instructions without further instruction',
    'ConsentToPledgeAcceptance',
  ),
  consent('smsFromDp', 'Consent for SMS from DP', 'ConsentForSMSFromDP'),
]

/** The answer that makes the authorised person's name mandatory. */
export const OTHER_BROKER_DEALING = 'otherBrokerDealing'

export interface MiscValues {
  /** Y / N per consent name; '' until answered. */
  answers: Record<string, string>
  authorizedPersonName: string
}

export const miscSchema = z
  .object({
    answers: z.record(z.string(), z.string()),
    authorizedPersonName: z.string(),
  })
  .superRefine((values, context) => {
    for (const { name } of CONSENTS) {
      if (values.answers[name] !== 'Y' && values.answers[name] !== 'N') {
        context.addIssue({ code: 'custom', path: ['answers', name], message: 'Choose Yes or No' })
      }
    }
    if (values.answers[OTHER_BROKER_DEALING] === 'Y' && !values.authorizedPersonName.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['authorizedPersonName'],
        message: 'Name of authorised person is required',
      })
    }
  })

export const MISC_DEFAULTS: MiscValues = {
  answers: Object.fromEntries(CONSENTS.map(({ name }) => [name, ''])),
  authorizedPersonName: '',
}

export const MISC_FIELDS = ['answers', 'authorizedPersonName']
