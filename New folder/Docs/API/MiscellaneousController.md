# MiscellaneousController

**File:** `Controllers/MiscellaneousController.cs`  
**Route prefix:** `/Onboarding/Miscellaneous/{action}`  
**Purpose:** Miscellaneous details and consents (stage 7): AMC, negative-list declarations, consent flags.

All actions require the anti-forgery token. Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | Downstream API |
|---|---|---|
| 1 | `SavemiscDetails` | `OpenAccountService/api/v1/AccountStaging/SetMiscDetails` |
| 2 | `GetMiscDetails` | `OpenAccountService/api/v1/AccountStaging/GetMiscDetails` |
| 3 | `getamctype` | `OpenAccountService/api/v2/Master/GetMaster` (12) |

---

## 1. SavemiscDetails

`POST /Onboarding/Miscellaneous/SavemiscDetails` with a JSON body.

### Request (`MiscDetailsRequest`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "MiscDetails": {
    "IsAMCApplicable": "Y", "AMCTypeID": "1", "AMCBankID": "", "AMCAmount": "500", "AMCNumber": "", "AMCDate": "",
    "IsInNegativeList": "N", "IsDisputeWithOtherMember": "N", "IsDefaulterSuspendedBySEBI": "N",
    "ACHFlag": "N", "IsKRACompliant": "Y"
  },
  "ConsentDetails": {
    "ConsentForAutoCredit": "Y", "ConsentForStandingPOA": "N",
    "ConsentToSendHoldingStatementOnAuthorizedEmail": "Y", "ConsentToShareEmailRTA": "Y",
    "ConsentForInternetTrading": "Y", "ConsentForExchangeMarginTrading": "N", "ConsentToRecieveAnnualReport": "Y",
    "ConsentForOtherBrokerDealing": "N", "ConsentForOtherBrokerRegNo": "", "OtherBrokerTelephoneNumber": "",
    "OtherBrokerFaxNumber": "", "OtherBrokerWebsiteURL": "", "ConsentForSMSFromDP": "Y",
    "ConsentToPledgeAcceptance": "N", "AuthorizedPersonName": "", "AuthorizedPersonAddress": "",
    "NomineeDeclarationFlag": "Y"
  }
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetMiscDetails
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response (200)

```json
{ "message": "Success", "Description": "" }
```

A null body returns 400 `"Invalid data."`. Downstream errors put `Message` / `Description` (default `"All fields are required to be filled."`) in the body. Exceptions are swallowed and the response comes back with empty values.

---

## 2. GetMiscDetails

`POST /Onboarding/Miscellaneous/GetMiscDetails` with a raw JSON string body, for example `"100045"`.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetMiscDetails
{ "FormEntryID": "100045" }
```

Response (`miscapidetails`):

```json
{
  "Status": "Success",
  "Data": {
    "MiscDetails": {
      "ACHFlag": "", "AMCAmount": "", "AMCBankID": "", "AMCNumber": "", "AMCTypeID": "", "AMCChequeDate": "",
      "IsKRACompliant": "", "IsAMCApplicable": "", "IsInNegativeList": "", "CreatedModifiedBy": 1,
      "CreatedModifiedOn": "", "IsDefaultSuspendedBySEBI": "", "IsDisputeWithOtherMember": ""
    },
    "ConsentDetails": {
      "AuthorizedPersonName": "", "ConsentForAutoCredit": "", "OtherBrokerFaxNumber": "", "ConsentForStandingPOA": "",
      "OtherBrokerWebsiteURL": "", "ConsentToShareEmailRTA": "", "NomineeDeclarationFlag": "", "AuthorizedPersonAddress": "",
      "ConsentForInternetTrading": "", "ConsentToPledgeAcceptance": "", "ConsentForOtherBrokerRegNo": "",
      "ConsentForSMSFromDP": "", "OtherBrokerTelephoneNumber": "", "ConsentForOtherBrokerDealing": "",
      "ConsentToRecieveAnnualReport": "", "ConsentForExchangeMarginTrading": "",
      "ConsentToSendHoldingStatementOnAuthorizedEmail": ""
    }
  },
  "Description": ""
}
```

> The response uses `AMCChequeDate` and `IsDefaultSuspendedBySEBI`, while the save request uses `AMCDate` and `IsDefaulterSuspendedBySEBI`. The UI has to map these names.

### Controller response

| Case | HTTP | Body |
|---|---|---|
| OK | 200 | `{ "message": "Data fetched successfully", "data": <miscapidetails> }` |
| Empty id | 400 | `"FormEntryID is required."` |
| 401 | 401 | – |
| Other | downstream code | `"Error fetching misc details"` |
| Exception | 500 | `"Internal server error"` |

---

## 3. getamctype

`POST /Onboarding/Miscellaneous/getamctype` (the query params `masterCode`, `parameter1..5` are ignored).

Downstream: `v2/Master/GetMaster` with masterCode **12**.

Response: `[ { "amc_name": "Lifetime", "amcid": "1" } ]`

Errors follow the README master pattern.
