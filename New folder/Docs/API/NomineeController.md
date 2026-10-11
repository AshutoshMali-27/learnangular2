# NomineeController

**File:** `Controllers/NomineeController.cs`  
**Route prefix:** `/Onboarding/Nominee/{action}`  
**Purpose:** Nominee and guardian details: save/load, proof upload, relation and proof-type masters, prefill from an existing customer.

All actions require the anti-forgery token. Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `SavenomineeData` | POST (form) | `OpenAccountService/api/v1/AccountStaging/SetNomineeDetails` |
| 2 | `SavenomineeDataforNoNominee` | POST (JSON) | `OpenAccountService/api/v1/AccountStaging/SetNomineeDetails` |
| 3 | `UploadFile` | POST (multipart) | – (file share) |
| 4 | `getrelationmaster` | POST | `v2/Master/GetMaster` (14) |
| 5 | `getNomineeonformid` | POST | `OpenAccountService/api/v1/AccountStaging/GetNomineeDetails` |
| 6 | `getprooftypemaster` | POST | `v2/Master/GetMaster` (14) |
| 7 | `GetExistingCustomerDetailsfornominee` | POST | `OpenAccountService/api/v1/NRI/GetExistingCustomerDetails` |

---

## Nominee request schema (`NomineeRequest`)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "NomOpt": "Y",
  "panno": "ABCDE1234F",
  "formno": "NRI000123",
  "NomineeDetails": [{
    "Segment": "DP",
    "NomNo": "1",
    "NamePrefix": "Mr", "FirstName": "", "MiddleName": "", "LastName": "",
    "PanNumber": "", "AadhaarNumber": "",
    "RelationshipID": "3", "RelationshipOther": "",
    "DateOfBirth": "2010-05-01",
    "AddressLine1": "", "AddressLine2": "", "AddressLine3": "",
    "CityID": "", "StateID": "", "CountryID": "", "Pincode": "",
    "TelephoneNumber": "", "FaxNumber": "", "MobileNumber": "", "EmailID": "",
    "BankAccountNumber": "", "ProofDetails": "", "DpID": "", "DpClientID": "",
    "ProofTypeID": "", "ProofNumber": "", "NomineeProofPath": "",
    "IsGuardianPresent": "Y",
    "DeclarationDetail": "", "DeclarationFlag": "", "DeclarationNRO": "", "DeclarationNRE": "",
    "NRIType": "", "ShareOfNominee": "100", "NOM_RESID_PAYBL": "",
    "GuardianDetails": {
      "NamePrefix": "", "FirstName": "", "MiddleName": "", "LastName": "",
      "RelationshipID": "", "RelationshipOther": "", "DateOfBirth": "", "AadhaarNumber": "", "PanNumber": "",
      "AddressLine1": "", "AddressLine2": "", "AddressLine3": "", "CityID": "", "StateID": "", "CountryID": "", "Pincode": "",
      "TelephoneNumber": "", "FaxNumber": "", "MobileNumber": "", "EmailID": "",
      "BankAccountNumber": "", "ProofDetails": "", "DpID": "", "DpClientID": "",
      "ProofTypeID": "", "ProofNumber": "", "GuardianProofPath": ""
    }
  }]
}
```

---

## 1. SavenomineeData

`POST /Onboarding/Nominee/SavenomineeData` with `multipart/form-data` or `x-www-form-urlencoded`. The form field `model` holds a JSON string of `NomineeRequest`.

Pre-processing: for each nominee, if `IsGuardianPresent != "Y"` then `GuardianDetails` is set to `null`. If it is `"Y"` and `GuardianDetails` is missing, an empty object is created.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetNomineeDetails
```

Body: the processed `NomineeRequest`. Response: `ClsValidateResponse` / `errorresponse`.

### Controller response (200)

```json
{ "message": "Success", "Description": "" }
```

On failure `message` is the downstream `Message` and `Description` its description (default `"All fields are required to be filled."`). On exception it returns `{ "message": "Error", "Description": "<ex>" }`.

## 2. SavenomineeDataforNoNominee

`POST /Onboarding/Nominee/SavenomineeDataforNoNominee` with a JSON body (`NomineeRequest`, typically `NomOpt = "N"` and an empty `NomineeDetails`).

Same downstream and response as #1, but the body is forwarded without guardian processing. A null body returns 400 `"Invalid data."`.

---

## 3. UploadFile

`POST /Onboarding/Nominee/UploadFile` with `multipart/form-data`: `proofFile`, `formno`, `panno`.

Saved as `{networkFolder}\{formno}_{panno}\NOM_PROOF_{formno}_{panno}_{yyyyMMddHHmmss}{ext}`. There is no file type or size validation.

```json
{ "success": true, "fileName": "NOM_PROOF_...pdf", "filePath": "NRI000123_ABCDE1234F/NOM_PROOF_...pdf", "savePath": "..." }
```

No file: 400 `{ "message": "No file selected." }`

---

## 4. getrelationmaster

`POST /Onboarding/Nominee/getrelationmaster` with a `masterrequest` body (ignored). masterCode **14**.

```json
[ { "nom_relationship_id": "1", "nom_relationship_name": "SPOUSE" } ]
```

## 6. getprooftypemaster

Same as #4: it also sends masterCode **14** and returns `nomenieeRelation[]`.

> ⚠ This looks like a copy-paste bug. A proof-type master would normally use a different code (for example 18, as in `Proof/getdocumentmaster`).

---

## 5. getNomineeonformid

`POST /Onboarding/Nominee/getNomineeonformid` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetNomineeDetails` with `{ "FormEntryID": "100045" }`

Response (`NomineeResponse`). Each row is a flattened nominee plus its guardian:

```json
{
  "Status": "Success",
  "Data": [{
    "Segment": "", "NomNo": "1", "NomineeNamePrefix": "", "FirstName": "", "MiddleName": "", "LastName": "", "PanNumber": "",
    "RelationshipID": "", "RelationshipOther": "", "DateOfBirth": "", "AadhaarNumber": "",
    "AddressLine1": "", "AddressLine2": "", "AddressLine3": "", "CityID": "", "StateID": "", "CountryID": "", "Pincode": "",
    "TelephoneNumber": "", "FaxNumber": "", "MobileNumber": "", "EmailID": "", "BankAccountNumber": "", "ProofDetails": "",
    "DpID": "", "DpClientID": "", "IsGuardianPresent": "Y", "DeclarationDetail": "", "DeclarationFlag": "",
    "DeclarationNRO": "", "DeclarationNRE": "", "NRIType": "", "ShareOfNominee": "", "NOM_RESID_PAYBL": "",
    "ProofTypeID": 3, "ProofNumber": "", "NomineeProofPath": "",
    "NomineeGuardianNamePrefix": "", "GuardianFirstName": "", "GuardianMiddleName": "", "GuardianLastName": "",
    "GuardianRelationshipID": "", "GuardianRelationshipOther": "", "GuardianDateOfBirth": "", "GuardianAadhaarNumber": "",
    "GuardianAddressLine1": "", "GuardianAddressLine2": "", "GuardianAddressLine3": "", "GuardianCityID": "",
    "GuardianStateID": "", "GuardianCountryID": "", "GuardianPincode": "", "GuardianTelephoneNumber": "",
    "GuardianFaxNumber": "", "GuardianMobileNumber": "", "GuardianBankAccountNumber": "", "GuardianProofDetails": "",
    "GuardianDpID": "", "GuardianDpClientID": "", "GuardianEmailID": "", "GuardianPanNumber": "",
    "GuardianProofTypeID": null, "GuardianProofNumber": "", "GuardianProofPath": "",
    "CreatedModifiedBy": "", "CreatedModifiedOn": ""
  }],
  "Description": ""
}
```

### Controller response (200)

Rows are re-shaped into the **same `NomineeDetails` structure used for saving** (`NomineeNamePrefix` → `NamePrefix`, `Guardian*` → nested `GuardianDetails`, `ProofTypeID` → string):

```json
{ "message": "Nominee details fetched successfully", "data": [ NomineeDetails ] }
```

`GuardianDetails` is always populated, even when `IsGuardianPresent = "N"`.

| Case | HTTP | Body |
|---|---|---|
| Empty id | 400 | `"FormEntryID is required."` |
| 401 | 401 | – |
| Other | downstream code | `"Error fetching nominee details"` |
| Exception | 500 | `"Internal server error"` |

---

## 7. GetExistingCustomerDetailsfornominee

`POST /Onboarding/Nominee/GetExistingCustomerDetailsfornominee`

```json
{ "panNo": "ABCDE1234F", "searchText": "NOMINEE", "skReferenceNo": "", "nriType": "" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetExistingCustomerDetails`

```json
{ "appName": "ONEKYC", "searchText": "NOMINEE", "panNo": "ABCDE1234F", "skReferenceNo": "", "nriType": "" }
```

Response: encrypted envelope. It is decrypted into `List<ContactDetail>`.

Controller response:

```json
[ { "MOBILE_NO": "", "MOBILE_DECLR_RELATION": 0, "EMAIL_ID": "", "EMAIL_DECLR_RELATION": 0, "NRI_TYPE": "" } ]
```

Errors: `{ "success": false, "message": "Invalid request data." | "PAN number is required." | "<Description>", "status": <code> }`

> The decrypted nominee payload is deserialised into `ContactDetail` (the email/mobile model), so any nominee-specific fields returned by the backend are dropped.
