# Stage 7 – Standing Instructions / Miscellaneous (`miscellaneous`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/miscellaneous?formNo=&stageId=&skrefno=&...` |
| Controller action | `nriaccountopening2Controller.miscellaneous` |
| View | `Views/nriaccountopening2/miscellaneous.cshtml` (page title "Standing Instruction Stage") |
| Scripts | `validations.js`, `miscellaneous2.js` |
| Server APIs | [MiscellaneousController.md](../API/MiscellaneousController.md) |

## 1. Purpose

Captures the client's **declarations and consents** required on the account-opening form: the negative-list declaration, depository standing instructions, electronic statements, internet trading, margin trading, dealing through authorised persons / other brokers, pledge acceptance and SMS alerts.

## 2. Page structure

Single visible step (`data-step="1"`, "Declarations & standing instruction"). Because there is only one step, **Next** is hidden and **Save** is shown immediately.

Two sections exist in the markup but are **hidden** (`d-none`) and not used:

| Hidden section | Controls |
|---|---|
| AMC Details | `amcapplicable` (yes/no), `ddlamctype` (loaded from AMC master), `ddlamcbank`, `txtamcamount` (numeric, 2 decimals), `txtamcnumber` (alnum), `txtamcdate` (≤ today). Ticking "yes" enables the fields |
| Declarations | `disputeWithMember`, `defaulterSebi`, `miscachflag` (yes/no) |
| KRA | `kracomplaint` (yes/no), `ddlmisckraagencylist` (NDML, CVL KRA, KARVY, CAMS, DOTEX) |
| "Is Now available" | checkbox `miscachyes` (name `miscachflag`) |

## 3. Visible fields (16 yes/no groups + 1 text)

All are radio pairs with values `yes` / `no`, sent as `Y` / `N`.

| # | Label | Radio name | Req | Payload (`ConsentDetails.` unless noted) |
|---|---|---|---|---|
| 1 | Negative list declaration | `negativeListDeclr` | ✔ | `MiscDetails.IsInNegativeList` |
| 2 | Consent to receive credits automatically into my/our Account | `CLI_RCV_CR_AUTO_FLG` | ✔ | `ConsentForAutoCredit` |
| 3 | Consent to Standing Instruction POA | `CLI_POW_AT_FLG` | ✔ | `ConsentForStandingPOA` |
| 4 | Consent to send ElecTrans-cum-Holding statement | `CLI_ELE_TRACMHOLD_FLG` | ✔ | `ConsentToSendHoldingStatementOnAuthorizedEmail` |
| 5 | Consent to share email ID with RTA | `CLI_EMAILRTA_FLG` | ✔ | `ConsentToShareEmailRTA` |
| 6 | Consent to internet trading / wireless technology | `CLI_INT_WT_FLG` | ✔ | `ConsentForInternetTrading` |
| 7 | Consent to Exchange Margin Trading | `CLI_EMF_FLG` | ✔ | `ConsentForExchangeMarginTrading` |
| 8 | Consent to receiving Annual Reports & Statement of Accounts | `CLI_MODEANN_RPT` | ✔ | `ConsentToRecieveAnnualReport` |
| 9 | Consent to dealing through authorised person and other stock broker | `CLI_DEAL_AUTH_SUB_BRK_FLG` | ✔ | `ConsentForOtherBrokerDealing` |
| 10 | … other stock broker NSE reg no. | `CLI_DEAL_SUB_BRK_REG_NO` | ✔ | `ConsentForOtherBrokerRegNo` |
| 11 | … other stock broker tel no | `CLI_DEAL_SUB_BRK_TELNO` | ✔ | `OtherBrokerTelephoneNumber` |
| 12 | … other stock broker fax | `CLI_DEAL_SUB_BRK_FAX` | ✔ | `OtherBrokerFaxNumber` |
| 13 | … other stock broker website | `CLI_DEAL_SUB_BRK_WEBSITE` | ✔ | `OtherBrokerWebsiteURL` |
| 14 | Consent to accept all pledge instructions without further instruction | `CLI_ACC_PLEDG_INS_FLG` | ✔ | `ConsentToPledgeAcceptance` |
| 15 | Consent for SMS from DP | `SMS_DP` | ✔ | `ConsentForSMSFromDP` |
| 16 | Name of authorized person | `txtmscnameofauthperson` (letters / spaces) | ✔ only if #9 = Yes (asterisk hidden when No) | `AuthorizedPersonName` |

## 4. Save

**Save** → `validateMiscAndConsent()` (every group above answered; name required when #9 = Yes) → `POST /Onboarding/Miscellaneous/SavemiscDetails`:

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "MiscDetails": {
    "IsAMCApplicable": "", "AMCTypeID": "0", "AMCBankID": "0", "AMCAmount": "0", "AMCNumber": "0", "AMCDate": "",
    "IsInNegativeList": "N", "IsDisputeWithOtherMember": "", "IsDefaulterSuspendedBySEBI": "", "ACHFlag": "", "IsKRACompliant": ""
  },
  "ConsentDetails": {
    "ConsentForAutoCredit": "Y", "ConsentForStandingPOA": "N", "ConsentToSendHoldingStatementOnAuthorizedEmail": "Y",
    "ConsentToShareEmailRTA": "Y", "ConsentForInternetTrading": "Y", "ConsentForExchangeMarginTrading": "N",
    "ConsentToRecieveAnnualReport": "Y", "ConsentForOtherBrokerDealing": "N", "ConsentForOtherBrokerRegNo": "N",
    "OtherBrokerTelephoneNumber": "N", "OtherBrokerFaxNumber": "N", "OtherBrokerWebsiteURL": "N",
    "ConsentToPledgeAcceptance": "N", "AuthorizedPersonName": "", "AuthorizedPersonAddress": "",
    "NomineeDeclarationFlag": "N", "ConsentForSMSFromDP": "Y"
  }
}
```

Response `message === "Success"` → "Miscellaneous details saved successfully!" → **always** to `forminward` (no objection-mode redirect).

## 5. API calls

| When | Endpoint |
|---|---|
| Load | `Miscellaneous/getamctype {masterCode:"12"}` → AMC types for the hidden drop-down |
| Save | `Miscellaneous/SavemiscDetails` |

## 6. Known issues

1. **No pre-fill**: the page never calls `GetMiscDetails`, so in objection mode (or when re-opening) all answers must be re-entered. There is also no objection banner on this page.
2. The "other broker tel / fax / website" fields are yes/no consents mapped onto fields that are named like data values (`OtherBrokerTelephoneNumber` = `"Y"`).
3. `NomineeDeclarationFlag` reads the hidden checkbox `miscachyes`, so it is always `N`.
4. The step rule (`stepValidationRules`) requires `miscachflag`, which is hidden. It is never used because there is only one step.
5. The AMC date format is converted to `dd-MM-yyyy`.

## 7. React migration notes

* Model the consents as a config array `{ key, label, payloadKey, required }` and render `<YesNo>` controls from it. Validation then becomes `every(answered)` plus the authorised-person rule.
* Load existing values with `GetMiscDetails` (response field names differ – `AMCChequeDate`, `IsDefaultSuspendedBySEBI`, see API doc).
* Drop or feature-flag the hidden AMC / KRA sections.
