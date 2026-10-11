# NRIAccountOpeningController

**File:** `Controllers/NRIAccountOpeningController.cs`  
**Route prefix:** `/Onboarding/NRIAccountOpening/{action}`  
**Purpose:** NRI form inward (stage 1), lead/REC/remiser/sales-code validation, PAN/email/mobile checks, address, all master dropdowns, NRI reports, objections, signed-PDF upload, liveliness, account-status search and courier tracking.

Unless stated otherwise, every downstream call is `POST` with JSON and `Authorization: Bearer <OpenAccountService token>`, and every action requires the anti-forgery token. See [README.md](README.md) for envelopes and the master-code table.

## Summary

| # | Action | Downstream API |
|---|---|---|
| V | `AccountDetails`, `Courier`, `AccountStatusDetails`, `AccountStatusreport`, `InprocessAccountDetails`, `pdfuploadformdetails`, `sendnotificationforliveproof`, `ObjectionForms`, `FormInward` | – (views) |
| 1 | `validatelead` | `Master/MasterValidate` (MasterCode 1) |
| 2 | `validatereccode` | `Master/MasterValidate` (MasterCode 4) |
| 3 | `validateremisercode` | `Master/MasterValidate` (MasterCode 3) |
| 4 | `validatesaleexecativecode` | `Master/MasterValidate` (MasterCode 2) |
| 5 | `CheckFormNo` | `NRI/ValidateFormNumber` |
| 6 | `CheckPanNo` | `NRI/CheckPanNo` → `PrefillPAN` → `PANInquiryITD` → `NegativeListCheck v2` |
| 7 | `checktssresult` | `UtilityService/Screening/v2/NegativeListCheck` |
| 8 | `CheckEmail` | `NRI/CheckEmail` → `NRI/SendVerificationEmail` |
| 9 | `CheckMobile` | `NRI/CheckMobileNo` |
| 10 | `SaveFormDetails` | `NRI/FormInward` |
| 11 | `GetDocument` | – (file share) |
| 12 | `GetFormDetails` | `NRI/GetFormInwardDetails` |
| 13 | `SaveAddress` | `AccountStaging/SetAddress` |
| 14 | `GetBrokerageData` | `v2/Master/GetMaster` (client masterCode) |
| 15 | `getAddressonformid` | `AccountStaging/GetAddress` |
| 16 | `getEmailRelation` | `v2/Master/GetMaster` (1) |
| 17 | `getmobileRelation` | `v2/Master/GetMaster` (1) |
| 18 | `getservingbranchcode` | `v2/Master/GetMaster` (2) |
| 19 | `getadmindetails` | `v2/Master/GetMaster` (3) |
| 20 | `getDPmaster` | `v2/Master/GetMaster` (4) |
| 21 | `getCountrymaster` | `v2/Master/GetMaster` (6) |
| 22 | `getStatemaster` | `v2/Master/GetMaster` (7) |
| 23 | `getCitymaster` | `v2/Master/GetMaster` (8) |
| 24 | `getKMPDesignationMaster` | `v2/Master/GetMaster` (17) |
| 25 | `GetNRIReportDetails` | `NRI/GetReportDetails` |
| 26 | `GetInprocessNRIReportDetails` | `NRI/GetReportDetails` (status 1) |
| 27 | `GetobjectionNRIReportDetails` | `NRI/GetDataObjectionForms` |
| 28 | `GetInProcessData` | `NRI/GetInProcessDetails` |
| 29 | `GetExistingCustomerDetails` | `NRI/GetExistingCustomerDetails` (EMLMOB) |
| 30 | `GetExistingCustomerDetailsforaddress` | `NRI/GetExistingCustomerDetails` (ADDRESS) |
| 31 | `GetObjectionFormDetails` | `NRI/GetDataObjections` |
| 32 | `closeobjection` | `v2/ScrutinyService/CloseObjection` |
| 33 | `GetFormDetailsForPDFUpload` | `NRI/GetFormDetailsForPDFUpload` |
| 34 | `UploadSignedPDF` | `NRI/SignedPDFUpload` |
| 35 | `ResendPDF` | `NRI/ResendGeneratedPDF` |
| 36 | `UploadPDFWithBankDetails` | `NRI/UploadPDFWithBankDetails` |
| 37 | `Getrecordforsendliveproof` | `AccountStaging/GetFormWithLivelinessPending` |
| 38 | `SendLivelinessMail` | `AccountStaging/SendLivelinessMail` |
| 39 | `getaccountstatusreportsearch` | `NRI/AccountStatusReportSearch` (SEARCH) |
| 40 | `getaccountstatusdetailedreports` | `NRI/AccountStatusReportSearch` (INDEPTH_SEARCH) |
| 41 | `getAvalaibleformnumbers` | `NRI/GetAvaliableFormDetails` |
| 42 | `SendVerificationMail` | `NRI/SendVerificationEmail` |
| 43 | `GetCuriorDetails` | `NRI/ClientToBranchCourierPendingForms` |
| 44 | `SaveCourierDetails` | `NRI/ClientCourierRecieved` or `NRI/CourierSentToHO` |
| 45 | `getFormStatus` | `v2/Master/GetMaster` (52) |

All `OpenAccountService/...` paths are relative to `{baseurl}`, so `NRI/X` means `{baseurl}OpenAccountService/api/v1/NRI/X`.

---

## V. View actions (GET)

All of them redirect to `/Onboarding/Auth/Login` if session `empId` is empty.

| Action | Query params | ViewBag |
|---|---|---|
| `AccountDetails`, `Courier`, `AccountStatusDetails`, `InprocessAccountDetails`, `pdfuploadformdetails`, `sendnotificationforliveproof`, `ObjectionForms` | – | – |
| `AccountStatusreport` | `formNo`, `custId` | `formNo`, `CustID` |
| `FormInward` | `stageId`, `viewdetails`, `skrefno`, `formNo` | `Employeecode`, `branchid`, `empId`, `stageId` (+1), `viewdetail`, `skrefno`, `formNo` |

---

## 1–4. Code validations (`MasterValidate`)

| Action | Controller params (form/query) | `MasterCode` | Decrypted item model | Success rule |
|---|---|---|---|---|
| `validatelead` | `leadid`, `barnchcode` | `"1"` | `responseforvalidate { ErrorMesssage }` | `[0].ErrorMesssage == "SUCCESS"` |
| `validatesaleexecativecode` | `salescode`, `barnchcode` | `"2"` | `SalesExecutive { salesex_empid, salesex_emp_code, salesex_name, reportto_empid, reportto_emp_code, reportto_name }` | `[0].salesex_empid != 0` |
| `validateremisercode` | `remisercode`, `barnchcode` | `"3"` | `responsevalidaeremisercode { Msg }` | `[0].Msg == "SUCCESS"` |
| `validatereccode` | `reccode`, `barnchcode` | `"4"` | `Employeereccode { empid, emp_code, emp_name }` | list not empty |

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/Master/MasterValidate
```

```json
{ "MasterCode": "1", "parameter1": "<code>", "parameter2": "<barnchcode>" }
```

Response: encrypted envelope → list described above.

### Controller response (HTTP 200)

```json
{ "isValid": true, "message": "Lead validated successfully.", "description": "" }
```

* `validatesaleexecativecode` puts the sales executive's name in `Description`.
* Failure: `isValid: false`, `message: "Validation failed."` (or the downstream `Message`), `Description` = error text.
* `validatelead` uses lower-case `description`; the other three use `Description`.

---

## 5. CheckFormNo

`POST /Onboarding/NRIAccountOpening/CheckFormNo?formNumber=NRI000123`

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/NRI/ValidateFormNumber
```

```json
{ "formNumber": "NRI000123", "branchId": "<session branchId>" }
```

Response (`EncryptedApiResponse`). The decrypted payload is `List<DecryptedFormEntry>`:

```json
[{ "Error_Message": "", "State": "NEW", "SkReferenceNo": "100045" }]
```

### Controller response (HTTP 200)

```json
{ "isValid": true, "Description": "", "state": "NEW", "errorMessage": "", "message": "Success", "SkReferenceNo": "100045" }
```

---

## 6. CheckPanNo

`POST /Onboarding/NRIAccountOpening/CheckPanNo?panNo=ABCDE1234F`

This action chains four downstream calls:

**a) Duplicate / eligibility check**

```
POST {baseurl}OpenAccountService/api/v1/NRI/CheckPanNo
{ "AppName": "ONEKYC", "PanNo": "ABCDE1234F", "branchId": "<session branchId>" }
```

Response: `ClsValidateResponse`. The chain continues only on `Message == "Success"`.

**b) PAN prefill (NSDL)**: UtilityService token

```
POST {baseurl}UtilityService/DigitalVerification/v2/PrefillPAN
{ "appName": "DIY", "PANNumber": "ABCDE1234F" }
```

Response (`ClsValidatePANResponse`):

```json
{ "Message": "Success", "Data": { "PanStatus": "E", "Name": "JOHN A DOE", "DateofBirth": "01/01/1990" }, "Description": "" }
```

**c) PAN–Aadhaar seeding (ITD)**: OpenAccountService token

```
POST {baseurl}OpenAccountService/api/v1/Digital/PANInquiryITD
{ "appName": "DIY", "panNo": "ABCDE1234F", "name": "JOHN A DOE", "dob": "01/01/1990", "loggedInUser": "123", "fatherName": "" }
```

Response (`ClsValidatePANaadharResponse`):

```json
{ "Message": "Success",
  "Data": { "Pan_status": "", "Name": "", "FatherName": "", "Dob": "", "SeedingStatus": "Y", "Response": "", "ErrorMessage": "" },
  "Description": "" }
```

**d) Negative-list screening (TSS)**: see #7. The name is split into first / middle / last, with `CustomerCategory = "IND"`.

### Controller response (`PanVerificationResponse`, HTTP 200)

```json
{
  "IsValid": true, "Description": "",
  "Dob": "01/01/1990", "Name": "JOHN A DOE", "PanStatus": "E",
  "ValidateDob": "", "ValidateName": "", "ValidatePanStatus": "",
  "SeedingStatus": "Y", "ErrorResponse": "", "ValidateResponse": "",
  "matchstatus": "NO_MATCH"
}
```

On failure: `IsValid: false` and `Description` = the reason (for example `"PAN details not found "` or the downstream description).

---

## 7. checktssresult

`POST /Onboarding/NRIAccountOpening/checktssresult` with a JSON body. **No anti-forgery check.**

### Controller request (`tssrequest`)

```json
{ "PanNumber": "ABCDE1234F", "FirstName": "JOHN", "MiddleName": "A", "LastName": "DOE", "DateOfBirth": "01/01/1990", "CustomerCategory": "IND" }
```

### Downstream (UtilityService token)

```
POST {baseurl}UtilityService/Screening/v2/NegativeListCheck
{ "panNumber": "...", "firstName": "...", "middleName": "...", "lastName": "...", "dateOfBirth": "...", "customerCategory": "IND" }
```

### Response (downstream, returned as-is) (`tssresponse`)

```json
{
  "Message": "Success",
  "Data": {
    "MatchStatus": "NO_MATCH", "RejectionMessage": "", "RequestID": "", "CaseID": "",
    "Alerts": [ { "Activity": "", "Source": "", "MatchType": "" } ]
  },
  "Description": ""
}
```

On error the controller builds `{ "Message": "Failed", "Data": null, "Description": "<reason>" }`.

---

## 8. CheckEmail

`POST /Onboarding/NRIAccountOpening/CheckEmail?email=&pan=&formNo=&empid=`

**a)** `POST {baseurl}OpenAccountService/api/v1/NRI/CheckEmail`

```json
{ "appName": "DIY", "Emailid": "a@b.com", "panNo": "ABCDE1234F", "isNRI": "Y" }
```

Response: `ClsValidateResponse`. If `Message == "Success"`, the action continues to:

**b)** `POST {baseurl}OpenAccountService/api/v1/NRI/SendVerificationEmail`

```json
{ "formNumber": "<formNo>", "panNo": "<pan>", "emailId": "<email>", "empId": "<empid>" }
```

### Controller response (HTTP 200)

```json
{ "isValid": true, "description": "" }
```

`isValid` is true only if **both** calls succeed.

---

## 9. CheckMobile

`POST /Onboarding/NRIAccountOpening/CheckMobile?mobile=&pan=&formNo=&empid=`

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/CheckMobileNo`

```json
{ "appName": "DIY", "mobileNo": "9999999999", "panNo": "ABCDE1234F", "isNRI": "Y" }
```

Controller response: `{ "isValid": <Message == "Success">, "description": "<Description>" }`

---

## 10. SaveFormDetails

`POST /Onboarding/NRIAccountOpening/SaveFormDetails` with `Content-Type: multipart/form-data` or `x-www-form-urlencoded`. The field `model` holds a JSON string of `FormInward`.

### `FormInward` (controller request = downstream request)

```json
{
  "formNo": "", "panNo": "", "dob": "", "Fname": "", "Mname": "", "Lname": "", "nameAsPerPan": "",
  "residentalStatus": "", "eqFlag": "", "fnoFlag": "", "currFlag": "", "comFlag": "", "mfFlag": "",
  "poa": "", "accountType": "", "contractNote": "", "emailId": "", "emailRel": "", "mobileNo": "",
  "mobileRel": "", "branchCode": "", "servingBranchCode": "", "preferredBranchCode": "", "adminName": "",
  "leadId": "", "salesExcode": "", "remiserCode": "", "referingEmployeeCode": "", "hniFlag": "",
  "entryBy": "", "updateBy": "", "accountWith": "", "loginId": "", "nrePis": "", "nreNonPis": "",
  "nroPis": "", "nroNonPis": "", "enableACH": "", "isExistingDp": "", "isExistNre": "", "isExistNro": "",
  "NreDPId": "", "NreBeneficiaryId": "", "NroDPId": "", "NroBeneficiaryId": "", "panlink_aadhar": "",
  "prefix": "", "gender": "", "maritalStatus": "", "isFatherOrHusband": "", "fatherHusbandName": "",
  "nriCategory": "", "scancopy1": "", "telephoneNo": "", "telephoneNoISD": "", "billSchId": "",
  "fatherHusbandFname": "", "fatherHusbandMname": "", "fatherHusbandLname": ""
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/NRI/FormInward
```

Response: encrypted envelope. Decrypted payload is `[{ "SkReferenceNo": "100045" }]`.

### Controller response

Always **HTTP 200**:

```json
{ "message": "Form saved successfully", "data": "<the original model string>", "skReferenceNo": "100045", "Description": "" }
```

On failure `skReferenceNo` is empty and `Description` holds the downstream error. Clients must check `skReferenceNo`.

---

## 11. GetDocument

`GET /Onboarding/NRIAccountOpening/GetDocument?path=<file>&formNo=&panNo=`. No anti-forgery check and no downstream call.

Reads `{networkFolder}\{formNo}_{panNo}\{Path.GetFileName(path)}` and returns the file stream (`application/pdf`, `image/jpeg`, `image/png` or `application/octet-stream`). Returns 400 if `path` is empty, 404 if the file is missing, and 400 `{ status: "Error", message }` on exception.

---

## 12. GetFormDetails

`POST /Onboarding/NRIAccountOpening/GetFormDetails` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetFormInwardDetails`

```json
{ "FormEntryID": "100045" }
```

Response: encrypted envelope → `List<FormInward>` (same fields as #10).

### Controller response

| Case | HTTP | Body |
|---|---|---|
| OK | 200 | `{ "message": "Form details retrieved successfully", "data": [ FormInward ] }` |
| Empty id | 400 | `"FormEntryID is required."` |
| 401 downstream | 401 | `"Unauthorized access."` |
| Other | downstream code | `{ "message": "<Description>" }` |
| Exception | 500 | `{ "message": "Internal server error", "error": "<ex>" }` |

---

## 13. SaveAddress

`POST /Onboarding/NRIAccountOpening/SaveAddress` with a JSON body.

### Request (`AddressRequest`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "AddressDetails": [{
    "IsSameAddress": "N",
    "HolderType": "1",
    "PermanentAddress":      { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "CountryID": "", "Pincode": "", "District": "" },
    "CorrespondenceAddress": { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "CountryID": "", "Pincode": "", "District": "" }
  }]
}
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetAddress`. Response: `ClsValidateResponse` / `errorresponse`.

Controller response: `{ "message": "Success", "Description": "" }`. On failure `message` is the downstream `Message` or `"Error"`.

---

## 14. GetBrokerageData

`POST /Onboarding/NRIAccountOpening/GetBrokerageData` with a JSON body. **No anti-forgery check.**

### Request (`masterrequest`)

```json
{ "masterCode": "<brokerage master code>", "parameter1": "<scheme id>" }
```

Downstream: `v2/Master/GetMaster` with `{ masterCode, parameter1, parameter2..5: "" }`. The decrypted payload is `List<BrokerageDataModel>`.

### Controller response: **first item only**

```json
{
  "name": "", "cash_delivery": "", "cash_intraday": "", "cash_futures": "", "cash_options": "",
  "currency_futures": "", "currency_options": "", "mcx_futures": "", "mcx_options": "",
  "dp_operating_charges": "", "ongoing_isin": "", "mtf_pledge_unpledge": "", "margin_pledge_unpledge": "",
  "accountopening": "", "mtf_upto_25_lakhs": "", "mtf_upto_25_lakhs_5_crore": "", "mtf_above_5_crore": "",
  "margin_pledge": "", "delayed_payment_charges": ""
}
```

---

## 15. getAddressonformid

`POST /Onboarding/NRIAccountOpening/getAddressonformid` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetAddress` with `{ "FormEntryID": "100045" }`

Response (`addressApiResponse`):

```json
{ "status": "Success",
  "data": [{ "AddressType": "PERMANENT", "HolderType": "1", "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "",
             "Landmark": "", "City": 1, "State": 1, "Country": 1, "Pincode": "", "District": "", "CreatedModifiedOn": "", "CreatedModifiedBy": 1 }],
  "description": "" }
```

The controller groups rows by `HolderType` into `AddressDetail` (PERMANENT / CORRESPONDENCE).

### Controller response (always 200)

```json
{ "message": "Form saved successfully", "data": { "FormEntryID": "100045", "EmployeeCode": null, "AddressDetails": [ AddressDetail ] } }
```

On failure `data` is `{ "FormEntryID": null, "AddressDetails": null }`.

---

## 16–24. Master dropdowns (`v2/Master/GetMaster`)

The request/response pattern is described in [README §5](README.md#5-master-api-getmaster-master-code-reference).

| # | Action | Controller input | masterCode | parameter1 | Response item |
|---|---|---|---|---|---|
| 16 | `getEmailRelation` | query params (ignored) | 1 | "" | `{ relationship_id, relationshipname }` |
| 17 | `getmobileRelation` | query params (ignored) | 1 | "" | `{ relationship_id, relationshipname }` |
| 18 | `getservingbranchcode` | query params (ignored) | 2 | "" | `{ branch_id, branch_name }` |
| 19 | `getadmindetails` | query params (ignored) | 3 | "" | `{ admin_id, admin_id1 }` |
| 20 | `getDPmaster` | query params (ignored) | 4 | "" | `{ dp_number, dp_name }` |
| 21 | `getCountrymaster` | query params (ignored) | 6 | "" | `{ country_id, country_name }` |
| 22 | `getStatemaster` | JSON `masterrequest` | 7 | `request.parameter1` (country id) | `{ state_id, state_name }` |
| 23 | `getCitymaster` | JSON `masterrequest` | 8 | `request.parameter1` (state id) | `{ city_id, city_name }` |
| 24 | `getKMPDesignationMaster` | JSON `masterrequest` (ignored) | 17 | "" | `{ serialno, description }`; **no anti-forgery check** |

Example: `POST /Onboarding/NRIAccountOpening/getStatemaster`

```json
{ "masterCode": "7", "parameter1": "101" }
```

```json
[ { "state_id": "1", "state_name": "MAHARASHTRA" } ]
```

---

## 25. GetNRIReportDetails

`POST /Onboarding/NRIAccountOpening/GetNRIReportDetails` with a JSON body.

### Request (`NRIReportRequest`, forwarded field by field)

```json
{
  "formNumber": "", "panNo": "", "mobileNumber": "", "emailId": "",
  "requestpunched_fromDate": "2025-01-01", "requestpunched_toDate": "2025-01-31",
  "update_fromDate": "", "update_toDate": "", "accountOpeningStatus": ""
}
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetReportDetails` with the same body.

Response: encrypted envelope. The decrypted payload is `[{ "ClientData": "<JSON string>" }]`, and `ClientData` is then deserialised again into `List<NRIClient>`.

### Controller response

```json
[{
  "PanNo": "", "EqFlag": "", "FormNo": "", "MfFlag": "", "ComFlag": "", "EmailId": "", "FnoFlag": "",
  "NRI_TYPE": "", "CurrFlag": "", "MobileNo": "", "BranchCode": 0, "PRODUCT_NAME": "", "NameAsPerPan": "",
  "SkReferenceNo": 100045, "Account_Status": "", "stage_id": "3"
}]
```

## 26. GetInprocessNRIReportDetails

Same as #25, except that `accountOpeningStatus` is forced to `"1"` (in-process).

---

## 27. GetobjectionNRIReportDetails

Request: `NRIReportRequest` (as #25).

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetDataObjectionForms`

```json
{ "FormNumber": "", "PANNumber": "", "MobileNumber": "", "EmailID": "",
  "FromDate": "<requestpunched_fromDate>", "ToDate": "<requestpunched_toDate>", "BranchID": "<session branchId>" }
```

The response is **not** encrypted (`NRIReportResponse1`) and is returned as-is:

```json
{ "Message": "Success",
  "Data": [{ "FormNumber": "", "SkReferenceNo": "", "FormPunchDate": "", "PANNumber": "", "ClientName": "",
             "Products": "", "EmailID": "", "MobileNumber": "", "NRI_TYPE": "" }],
  "Description": "" }
```

---

## 28. GetInProcessData

`POST /Onboarding/NRIAccountOpening/GetInProcessData`

```json
{ "formNumber": "NRI000123" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetInProcessDetails`

```json
{ "formNumber": "NRI000123", "panNo": "", "mobileNumber": "", "emailId": "", "accountOpeningStatus": "",
  "requestpunched_fromDate": "", "requestpunched_toDate": "", "update_fromDate": "", "update_toDate": "" }
```

Response: encrypted envelope. The decrypted payload is `[{ "INPROCESS_DATA": "<JSON string>" }]`, and each `INPROCESS_DATA` is parsed into `InProcessData`.

### Controller response (HTTP 200)

```json
{
  "success": true,
  "message": "Data fetched successfully.",
  "data": [{
    "Nre_Nonpis": "", "Nre_Pis": "", "Nro_Nonpis": "", "Nro_Pis": "", "Stage_id": 3, "HolderCount": 1,
    "Pan_No": "", "Is_Bank_Available": "", "Nri_Category": "", "Email_Id": "",
    "HolderType": [{ "gender": "", "holder_type": "", "maritial_status": "" }]
  }],
  "status": 200
}
```

`message` becomes `"No records found."` when the list is empty, `"Form number is required."` (status 400) when no form number is given, and similar messages for the other error cases.

---

## 29. GetExistingCustomerDetails

`POST /Onboarding/NRIAccountOpening/GetExistingCustomerDetails`

### Request (`clsexistingcustomerdetailsrequest`)

```json
{ "panNo": "ABCDE1234F", "searchText": "EMLMOB", "skReferenceNo": "", "nriType": "" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetExistingCustomerDetails`

```json
{ "appName": "ONEKYC", "searchText": "EMLMOB", "panNo": "ABCDE1234F", "skReferenceNo": "", "nriType": "" }
```

Response: encrypted envelope → `List<ContactDetail>`.

### Controller response

```json
[{ "MOBILE_NO": "", "MOBILE_DECLR_RELATION": 1, "EMAIL_ID": "", "EMAIL_DECLR_RELATION": 1, "NRI_TYPE": "" }]
```

Errors: `{ "success": false, "message": "PAN number is required." | "<Description>", "status": <code> }`

## 30. GetExistingCustomerDetailsforaddress

Same request and downstream as #29, but `searchText` defaults to `"ADDRESS"`. The decrypted payload is `List<AddressApiModel>`, grouped by holder into the response:

```json
{ "FormEntryID": null, "EmployeeCode": null, "AddressDetails": [ { "HolderType": "1", "PermanentAddress": { }, "CorrespondenceAddress": { } } ] }
```

---

## 31. GetObjectionFormDetails

`POST /Onboarding/NRIAccountOpening/GetObjectionFormDetails` with a raw JSON string body, for example `"100045"` (SK reference no).

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetDataObjections` with `{ "SkReferenceNo": "100045" }`

The response is not encrypted (`clsbojectionmodel`). The `Data` key is the stage id (1–11):

```json
{
  "Message": "Success",
  "Data": {
    "1": { "Remarks": "PAN copy unclear", "Objections": [ { "Objection": "PAN mismatch", "ObjectionID": 12 } ] },
    "2": { "Remarks": null, "Objections": null }
  },
  "Description": ""
}
```

The controller fills in any missing stage keys `"1"`–`"11"` with `{ Remarks: null, Objections: null }` and returns 200. Errors come back as `{ "Message": "Error", "Description": "..." }` with HTTP 400 / 401 / downstream code / 500.

---

## 32. closeobjection

`POST /Onboarding/NRIAccountOpening/closeobjection`

```json
{ "skReferenceNo": "100045", "Objections": "12,13" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v2/ScrutinyService/CloseObjection`

```json
{ "appName": "DIY", "Objections": "12,13", "skReferenceNo": "100045", "UpdateBy": "<session empId>" }
```

Controller response: the downstream `{ Message, Data: { CipherText, InitialVector }, Description }` as-is (not decrypted), or `{ success: false, message, status }`.

---

## 33. GetFormDetailsForPDFUpload

Request: `NRIReportRequest`. Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetFormDetailsForPDFUpload` with the same body shape as #27.

The response (`NRIReportResponseforpdfupload`) is passed through:

```json
{ "Message": "Success",
  "Data": [{
    "EmailID": "", "NRIType": "", "PDFType": "", "Products": "",
    "Objection": { "Remarks": "", "Objections": [ "..." ] },
    "PANNumber": "", "ClientName": "", "FormNumber": "", "MobileNumber": "", "FormPunchDate": "",
    "SkReferenceNo": 100045, "PDFCooldownTimeLeft": null
  }],
  "Description": "" }
```

---

## 34. UploadSignedPDF

`POST /Onboarding/NRIAccountOpening/UploadSignedPDF` with `multipart/form-data`.

| Form field | Type |
|---|---|
| `file` | PDF file |
| `formNumber` | string |
| `skReferenceNo` | string (required) |
| `panNo` | string |

The file is saved as `{networkFolder}\{formNumber}_{panNo}\SignedPDF_{formNumber}_{panNo}_{yyyyMMddHHmmss}.pdf`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/SignedPDFUpload`

```json
{ "FormEntryID": "<skReferenceNo>", "UploadPath": "<formNumber>_<panNo>/SignedPDF_....pdf", "EmployeeID": "<session empId>" }
```

Controller response (200): `{ "message": "Success" | "Error", "Description": "..." }`

## 35. ResendPDF

```json
{ "FormEntryID": "100045", "EmployeeID": "(ignored – session empId used)" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/ResendGeneratedPDF` with `{ "FormEntryID": "100045", "EmployeeID": "<session empId>" }`

Controller response: `{ "message": "Success" | "Error", "Description": "..." }`

## 36. UploadPDFWithBankDetails

Same contract as #34 (same form fields, same file naming). Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/UploadPDFWithBankDetails`

```json
{ "FormEntryID": "<skReferenceNo>", "EmployeeID": "<session empId>", "UploadPath": "<relative path>" }
```

---

## 37. Getrecordforsendliveproof

Request: `NRIReportRequest`. Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetFormWithLivelinessPending` (body as #27).

The response (`Livelinessreport`) is passed through:

```json
{ "Message": "Success",
  "Data": [{ "FormNumber": "", "SkReferenceNo": "", "FormPunchDate": "", "PANNumber": "", "ClientName": "", "Products": "",
             "EmailID": "", "MobileNumber": "", "NRI_TYPE": "", "CanSendMail": "Y", "MailLastSentOn": "", "HolderType": "1",
             "IsEmailOTPVerified": "" }],
  "Description": "" }
```

## 38. SendLivelinessMail

```json
{ "FormEntryID": "100045", "EmployeeID": "", "holderType": "1" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/SendLivelinessMail`

```json
{ "FormEntryID": "100045", "EmployeeID": "<session empId>", "HolderType": "1" }
```

Controller response: `{ "message": "Success" | "Error", "Description": "..." }`

---

## 39. getaccountstatusreportsearch

### Request (`SearchRequest`)

```json
{ "customerId": "", "s2kId": "", "dpClientId": "", "formNumber": "", "loginId": "", "mobileNo": "", "panNo": "",
  "emailId": "", "formStatusId": "", "formRecDateFrom": "", "formRecDateTo": "", "accountOpenedFromDt": "",
  "accountOpenetToDt": "", "empId": "" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/AccountStatusReportSearch`. The body uses the same fields in PascalCase, plus `"Mode": "SEARCH"` and `"BranchId": "<session branchId>"`.

Response: encrypted envelope → `List<SearchData>`.

### Controller response

```json
[{ "PAN_NO": "", "S2K_ID": "", "LEAD_ID": 0, "LOGIN_ID": "", "NRI_TYPE": "", "PRODUCTS": "", "BRANCH_ID": 0,
   "CustomerID": "", "BRANCH_CODE": "", "BRANCH_NAME": "", "CLIENT_NAME": "", "FORM_NUMBER": "", "FORM_STATUS": "",
   "Lockremarks": "", "UPDATE_DATE": "", "ACCOUNT_TYPE": "", "ACCOUNT_STATUS": "", "ACCT_OPEN_DATE": "" }]
```

## 40. getaccountstatusdetailedreports

Request: `SearchRequest` (only `customerId` is used). Downstream: same URL with `"Mode": "INDEPTH_SEARCH"`, `CustomerId` set and every other field `""`.

The decrypted payload is `AccountStatusReportInDepthReport` (see `Models/viewmodels/accountstatusreportindepthreport.cs`), which the controller returns:

```json
{
  "DPDetail": [ { "Poa": "", "Bsda": "", "DpName": "", "DpType": "", "Status": "", "IsDefault": "", "DpIdNumber": "", "HolderDetails": {}, "DpWithClientId": "", "DpBeneficiaryName": "", "InvesttigerStatus": "", "ClientBenficiaryId": "" } ],
  "ClientData": { "...": "client master fields (PANNO, KYCNO, S2K_ID, EmailID, ...)" },
  "BankDetails": [ { } ],
  "FATCADetail": [ { } ],
  "NomineeDetail": [ { } ],
  "DocProofDetails": [ { "SrNo": 1, "ProofName": "", "FormNumber": "", "DateOfIssue": "", "ProofNumber": "", "DateOfExpiry": "", "PlaceOfIssue": "" } ],
  "AnnualIncomeProof": [],
  "Client Extra Detail": { },
  "RegisteredAddressDetails": { },
  "ClientJurisdictionDetails": { },
  "CommunicationAddressDetails": { }
}
```

---

## 41. getAvalaibleformnumbers

`POST /Onboarding/NRIAccountOpening/getAvalaibleformnumbers` with no body.

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetAvaliableFormDetails`

```json
{ "DocSubTypeID": "802", "BranchId": "<session branchId>" }
```

Response: encrypted envelope → `List<string>`.

Controller response: `["NRI000123", "NRI000124"]`

## 42. SendVerificationMail

`POST /Onboarding/NRIAccountOpening/SendVerificationMail?formNo=&pan=&email=` (all three required)

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/SendVerificationEmail`

```json
{ "formNumber": "<formNo>", "panNo": "<pan>", "emailId": "<email>", "empId": "<session empId>" }
```

Controller response: `{ "message": "Success" | "Error", "Description": "..." }`

---

## 43. GetCuriorDetails

### Request (`CourierRequestModel`)

```json
{ "FormNumber": "", "PANNumber": "", "MobileNumber": "", "EmailID": "", "FromDate": "", "ToDate": "", "CourierType": "client to branch" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/ClientToBranchCourierPendingForms` with the same fields, plus `BranchID` from the session (nulls become `""`).

The response (`CuriorPendingForms`) is passed through:

```json
{ "Message": "Success",
  "Data": [{ "FormNumber": "", "SkReferenceNo": "", "FormPunchDate": "", "BranchName": "", "PANNumber": "", "ClientName": "",
             "Products": "", "EmailID": "", "MobileNumber": "", "NRI_TYPE": "" }],
  "Description": "" }
```

## 44. SaveCourierDetails

### Request (`CourierSaveRequestModel`)

```json
{ "FormNumber": "NRI000123", "AWBNumber": "AWB123", "Remark": "", "CourierType": "client to branch" }
```

`CourierType` (case-insensitive) selects the endpoint:

| CourierType | Downstream |
|---|---|
| `client to branch` | `POST {baseurl}OpenAccountService/api/v1/NRI/ClientCourierRecieved` |
| `branch to ho` | `POST {baseurl}OpenAccountService/api/v1/NRI/CourierSentToHO` |

Downstream body: `{ "FormNumber": "", "Remark": "", "AWBNumber": "" }`

Response (`CourierSaveResponse`), passed through: `{ "Message": "Success", "Description": "" }`

Errors: `{ "Message": "Failed", "Description": "Form number and AWB number are required." | "Invalid action type." | ... }`. Note the anti-forgery failure body also uses `Message` / `Description` here.

---

## 45. getFormStatus

`POST /Onboarding/NRIAccountOpening/getFormStatus` with a `MasterRequestModel` JSON body (values are ignored).

Downstream: `v2/Master/GetMaster` with masterCode **52**.

Response: `[ { "FORM_STATUS_ID": 1, "FORM_STATUS": "In Process" } ]`

---

## Observations

* `checktssresult`, `GetBrokerageData` and `getKMPDesignationMaster` skip anti-forgery validation.
* `closeobjection` returns the encrypted envelope without decrypting it.
* `SaveFormDetails` returns HTTP 200 "Form saved successfully" even when the downstream call fails. Use `skReferenceNo` / `Description` to detect failure.
* The PAN chain (#6) runs four sequential downstream calls and generates three tokens.
