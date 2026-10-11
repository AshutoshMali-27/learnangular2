# holderController

**File:** `Controllers/holderController.cs`  
**Route prefix:** `/Onboarding/holder/{action}`  
**Purpose:** Holder (primary / joint) details: PAN verification, email/mobile checks, address, holder save/load and the related masters.

Unless noted, every downstream call is `POST` JSON with `Authorization: Bearer <OpenAccountService token>`, and every action requires the anti-forgery token. See [README.md](README.md).

## Summary

| # | Action | Downstream API |
|---|---|---|
| 1 | `CheckPanNoforholder` | `UtilityService/DigitalVerification/v2/PrefillPAN` → `OpenAccountService/api/v1/Digital/PANInquiryITD` → `UtilityService/Screening/v1/NegativeListCheck` |
| 2 | `EmailRelationforholder` | `v2/Master/GetMaster` (1) |
| 3 | `mobrelationforholder` | `v2/Master/GetMaster` (1) |
| 4 | `getCountrymasterforholder` | `v2/Master/GetMaster` (6) |
| 5 | `getoccupationdetails` | `v2/Master/GetMaster` (9) |
| 6 | `getStatemasterforholder` | `v2/Master/GetMaster` (7) |
| 7 | `getCitymasterforholder` | `v2/Master/GetMaster` (8) |
| 8 | `CheckEmailforholder` | `OpenAccountService/api/v1/NRI/CheckEmail` |
| 9 | `CheckMobileforholder` | `OpenAccountService/api/v1/NRI/CheckMobileNo` |
| 10 | `SaveHolders` | via #11 → `AccountStaging/SetHolderDetails` |
| 11 | `SaveHolderData` | `OpenAccountService/api/v1/AccountStaging/SetHolderDetails` |
| 12 | `SaveAddress` | `OpenAccountService/api/v1/AccountStaging/SetAddress` |
| 13 | `getholderonformid` | `OpenAccountService/api/v1/AccountStaging/GetHolderDetails` |
| 14 | `checktssresult` | `UtilityService/Screening/v1/NegativeListCheck` |

---

## 1. CheckPanNoforholder

`POST /Onboarding/holder/CheckPanNoforholder?panNo=ABCDE1234F`

Unlike `NRIAccountOpening/CheckPanNo`, this action does **not** call `NRI/CheckPanNo` (the duplicate check). It goes straight to:

**a) PrefillPAN** (UtilityService token)

```
POST {baseurl}UtilityService/DigitalVerification/v2/PrefillPAN
{ "appName": "DIY", "PANNumber": "ABCDE1234F" }
```

```json
{ "Message": "Success", "Data": { "PanStatus": "E", "Name": "JOHN A DOE", "DateofBirth": "01/01/1990" }, "Description": "" }
```

**b) PANInquiryITD**

```
POST {baseurl}OpenAccountService/api/v1/Digital/PANInquiryITD
{ "appName": "DIY", "panNo": "ABCDE1234F", "name": "JOHN A DOE", "dob": "01/01/1990", "loggedInUser": "123", "fatherName": "" }
```

```json
{ "Message": "Success", "Data": { "Pan_status": "", "Name": "", "FatherName": "", "Dob": "", "SeedingStatus": "", "Response": "", "ErrorMessage": "" }, "Description": "" }
```

**c) NegativeListCheck v1** (UtilityService token)

```
POST {baseurl}UtilityService/Screening/v1/NegativeListCheck
{ "panNumber": "ABCDE1234F", "firstName": "JOHN", "middleName": "A", "lastName": "DOE", "dateOfBirth": "01/01/1990", "customerCategory": "IND" }
```

```json
{ "Message": "Success", "Data": { "MatchStatus": "NO_MATCH", "RejectionMessage": "", "RequestID": "", "CaseID": "", "Alerts": [] }, "Description": "" }
```

### Controller response (`PanVerificationResponse`, HTTP 200)

```json
{ "IsValid": true, "Description": "", "Dob": "01/01/1990", "Name": "JOHN A DOE", "PanStatus": "E",
  "ValidateDob": "", "ValidateName": "", "ValidatePanStatus": "", "SeedingStatus": "", "ErrorResponse": "",
  "ValidateResponse": "", "matchstatus": "NO_MATCH" }
```

On PrefillPAN failure: `IsValid: false` and `Description` = `"Invalid ID number or combination of inputs"`, `"You are not authorized..."` or the exception text.

---

## 2–7. Master dropdowns

`POST`, with the controller input shown below. The downstream call is `POST {baseurl}OpenAccountService/api/v2/Master/GetMaster`, and the request and response follow [README §5](README.md#5-master-api-getmaster-master-code-reference).

| # | Action | Controller input | masterCode | parameter1 | Response item |
|---|---|---|---|---|---|
| 2 | `EmailRelationforholder` | `masterCode`, `parameter1..5` query/form (ignored) | 1 | "" | `{ relationship_id, relationshipname }` |
| 3 | `mobrelationforholder` | same (ignored) | 1 | "" | `{ relationship_id, relationshipname }` |
| 4 | `getCountrymasterforholder` | same (ignored) | 6 | "" | `{ country_id, country_name }` |
| 5 | `getoccupationdetails` | same (ignored) | 9 | "" | `{ occupation_id, occupation_name }` |
| 6 | `getStatemasterforholder` | JSON `masterrequest` | 7 | `parameter1` (country id) | `{ state_id, state_name }` |
| 7 | `getCitymasterforholder` | JSON `masterrequest` | 8 | `parameter1` (state id) | `{ city_id, city_name }` |

Example for #7:

```json
// POST /Onboarding/holder/getCitymasterforholder
{ "masterCode": "8", "parameter1": "21" }
```

```json
[ { "city_id": "101", "city_name": "MUMBAI" } ]
```

---

## 8. CheckEmailforholder

`POST /Onboarding/holder/CheckEmailforholder?email=&pan=&formNo=&empid=`

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/CheckEmail`

```json
{ "appName": "DIY", "Emailid": "a@b.com", "panNo": "ABCDE1234F", "isNRI": "Y" }
```

Response: `ClsValidateResponse`.

Controller response: `{ "isValid": true, "description": "" }`. On failure `isValid` is false and `description` = downstream `Description`. No verification email is sent, unlike the NRIAccountOpening version.

## 9. CheckMobileforholder

`POST /Onboarding/holder/CheckMobileforholder?mobile=&pan=&formNo=&empid=`

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/CheckMobileNo`

```json
{ "appName": "DIY", "mobileNo": "9999999999", "panNo": "ABCDE1234F", "isNRI": "Y" }
```

Controller response: `{ "isValid": <Message=="Success">, "description": "" }`. When the downstream returns 200 with a non-success message, `description` stays empty and the reason is only logged.

---

## 10. SaveHolders

`POST /Onboarding/holder/SaveHolders` with a `HolderDataModel` JSON body (see #11).

This copies the input and calls `SaveHolderData` (#11) **in-process**. Because #11 validates anti-forgery again, the same request token is reused.

Controller response (200):

```json
{ "success": true, "holder": { "Message": "Success", "Description": "" } }
```

On exception: 500 `{ "success": false, "message": "<ex>" }`

## 11. SaveHolderData

`POST /Onboarding/holder/SaveHolderData` with a JSON body.

### Request (`HolderDataModel`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "IsHolderAvailable": "Y",
  "HolderDetails": [{
    "HolderType": "1", "FirstName": "", "ResidentialStatusSubtype": "", "MiddleName": "", "NamePrefix": "", "LastName": "",
    "PAN": "", "SmsTrading": "", "DateOfBirth": "", "Gender": "", "MaritialStatus": "", "FatherHusbandFlag": "",
    "FatherHusbandName": "", "EmailID": "", "MobileNumber": "", "OccupationTypeID": "", "IncomeSlabID": "",
    "EmailRelation": "", "MobileRelation": "", "MotherFirstName": "", "MotherMiddleName": "", "MotherLastName": "",
    "PrefixMaidenName": "", "MaidenFirstName": "", "MaidenMiddleName": "", "MaidenLastName": "",
    "PrefixFatherHusbandName": "", "FatherHusbandFirstName": "", "FatherHusbandMiddleName": "", "FatherHusbandLastName": "",
    "FormerAliasesName": "", "Citizenship": "", "PanLinkWithAadhaar": ""
  }],
  "AddressDetails": [{
    "IsSameAddress": "N", "HolderType": "1",
    "PermanentAddress": { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "CountryID": "", "Pincode": "", "District": "" },
    "CorrespondenceAddress": { "...": "same as PermanentAddress" }
  }]
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetHolderDetails
```

Response: `ClsValidateResponse` `{ Status, Message, Data, Description }` or `errorresponse`.

### Controller response (200)

```json
{ "message": "Success", "Description": "" }
```

`message` = downstream `Status` on success, or `Message` on failure. A null holder returns 400 `"Invalid data."`.

---

## 12. SaveAddress

`POST /Onboarding/holder/SaveAddress` with an `AddressRequest` JSON body (same schema as NRIAccountOpening `SaveAddress`).

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetAddress`

Controller response: `{ "message": "<Status | Message>", "Description": "..." }`

---

## 13. getholderonformid

`POST /Onboarding/holder/getholderonformid` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetHolderDetails` with `{ "FormEntryID": "100045" }`

Response (`holderApiResponse`). Every row is a flattened holder plus its permanent and correspondence address:

```json
{
  "status": "Success",
  "data": [{
    "HolderType": "1", "FirstName": "", "MiddleName": "", "NamePrefix": "", "LastName": "", "PAN": "", "SmsTrading": "",
    "DateOfBirth": "", "Gender": "", "MaritialStatus": "", "FatherHusbandFlag": "", "FatherHusbandName": "", "EmailID": "",
    "MobileNumber": "", "OccupationTypeID": "", "IncomeSlabID": "", "EmailRelation": "", "MobileRelation": "",
    "MotherFirstName": "", "MotherMiddleName": "", "MotherLastName": "", "PrefixMaidenName": "", "MaidenFirstName": "",
    "MaidenMiddleName": "", "MaidenLastName": "", "PrefixFatherHusbandName": "", "FatherHusbandFirstName": "",
    "FatherHusbandMiddleName": "", "FatherHusbandLastName": "", "FormerAliasesName": "", "Citizenship": "",
    "PanLinkWithAadhaar": "", "ResidentialStatusSubtype": "", "IsSameAddress": "N",
    "PerAddressLineOne": "", "PerAddressLineTwo": "", "PerAddressLineThree": "", "PerAddressLineFour": "", "PerLandmark": "",
    "PerCityID": "", "PerStateID": "", "PerPincode": "", "PerCountryID": "", "PerDistirct": "",
    "CorAddressLineOne": "", "CorAddressLineTwo": "", "CorAddressLineThree": "", "CorAddressLineFour": "", "CorLandmark": "",
    "CorCityID": "", "CorStateID": "", "CorPincode": "", "CorCountryID": "", "CorDistirct": ""
  }],
  "description": ""
}
```

### Controller response (200)

The controller splits each row into `HolderDetails[]` and `AddressDetails[]` (`IsSameAddress` is taken from the first row):

```json
{
  "message": "Form data loaded successfully",
  "data": {
    "FormEntryID": "100045",
    "EmployeeCode": null,
    "HolderDetails": [ { "HolderType": "1", "FirstName": "", "PAN": "", "...": "all HolderDetail fields (see #11)" } ],
    "AddressDetails": [ { "HolderType": "1", "IsSameAddress": "N", "PermanentAddress": { }, "CorrespondenceAddress": { } } ]
  }
}
```

| Case | HTTP | Body |
|---|---|---|
| Empty id | 400 | `"Invalid data."` |
| Downstream non-2xx | same code | `{ "message": "API Error", "error": "<raw body>" }` |
| Exception | 500 | `{ "message": "Internal Server Error", "error": "<ex>" }` |

---

## 14. checktssresult

`POST /Onboarding/holder/checktssresult` with a `tssrequest` JSON body. **No anti-forgery check.**

Same contract as `NRIAccountOpening/checktssresult`, except that it calls **`UtilityService/Screening/v1/NegativeListCheck`** (v1, not v2). Returns `tssresponse`.

---

## Observations

* The PAN flow uses NegativeListCheck **v1** here and **v2** in `NRIAccountOpeningController`. Confirm which version is intended.
* `PANInquiryITD` is called with a hard-coded `loggedInUser: "123"`.
