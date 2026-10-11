# ExtraDetailsController

**File:** `Controllers/ExtraDetailsController.cs`  
**Route prefix:** `/Onboarding/ExtraDetails/{action}`  
**Purpose:** "Other / extra details" (IPV, OSV, interview, investment experience), face-liveliness capture (SDK image), the liveliness email, IPV document upload and employee e-sign lookup (TAB).

HTTP clients:

* `client` → `{baseurl}`: OpenAccountService and CommunicationService
* `client2` → `{TAB:GetEmpSign}`: TAB sales service

## Summary

| # | Action | Anti-forgery | Downstream API |
|---|---|---|---|
| 1 | `SaveExtraDetails` | ✔ | `OpenAccountService/api/v1/AccountStaging/SetOtherDetails` |
| 2 | `GetExtraDetails` | ✔ | `OpenAccountService/api/v1/AccountStaging/GetOtherDetails` |
| 3 | `SaveSDKImage` | ✘ (commented out) | `OpenAccountService/api/v1/AccountStaging/SaveLivelinessDetails` |
| 4 | `SendEmailForLivelinessCheck` | ✔ | `CommunicationService/Email/v2/SendMail` |
| 5 | `UploadFile` | ✔ | – (file share) |
| 6 | `GetesigndetailsDetails` | ✔ | `GET {TAB:GetEmpSign}?empCode=` |

---

## 1. SaveExtraDetails

`POST /Onboarding/ExtraDetails/SaveExtraDetails` with `multipart/form-data` or `x-www-form-urlencoded`. The form field `model` holds a JSON string of `ExtraDetailsModel`.

### Request (`ExtraDetailsModel`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "panno": "ABCDE1234F",
  "formno": "NRI000123",
  "OtherDetails": {
    "osv_staff_code": "", "interviewd_staff_code": "", "tipvempcode": "", "is_bank_available": "Y",
    "dipvverificationdt": "", "osv_date": "", "interviewed_date": "", "lipvbranchid": "", "tipvverplace": "",
    "country_of_res": "", "country_of_res_oth": "", "country_src_income": "", "country_src_income_oth": "",
    "invstmnt_thrgh_shrkhn": "", "nature_of_bus_desc": "", "kmp_desg_id": "", "kmp_desg_desc": "",
    "access_insider_info": "", "access_insider_info_rmrks": "", "usg_sensitv_prdcts_servcs": "",
    "former_aliasesname": "", "citizenship": "",
    "ipv_name": "", "osv_name": "", "interviewer_name": "",
    "ipv_desg": "", "osv_desg": "", "interviewer_desg": "",
    "ipv_sign_path": "", "osv_sign_path": "", "interviewer_sign_path": "",
    "is_prior_investment_expirience": "", "investment_expirience_yrs": "", "expirience_in_derivatives_yrs": "",
    "other_investment_fields_expirience_yrs": "", "factiva_upload_path": ""
  }
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetOtherDetails
Authorization: Bearer <OpenAccountService token>
```

Response: `ClsValidateResponse`. On 400 the response is an ASP.NET `ValidationErrorResponse`, otherwise `errorresponse`.

### Controller response (200)

| Downstream | Body |
|---|---|
| 2xx | `{ "message": "<Status>", "Description": "" }` |
| 401 | `{ "message": "<Message>", "Description": "<Description>" }` |
| 400 | `{ "message": "<title>", "Description": "<all validation messages joined by newline>" }` |
| other | `{ "message": "<Message>", "Description": "<Description or 'All fields are required to be filled.'>" }` |
| exception | `{ "message": "Error", "Description": "<ex>" }` |

A missing `model` returns 400 `"Invalid data."`.

---

## 2. GetExtraDetails

`POST /Onboarding/ExtraDetails/GetExtraDetails` with a raw JSON string body, for example `"100045"`.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetOtherDetails
{ "FormEntryID": "100045" }
```

Response (`ClsValidateResponse`; `Data` is an array and only the **first** element is used):

```json
{ "Status": "Success", "Data": [ {
    "form_entry_id": 100045, "ipv_veri_id": "", "osv_staff_code": "", "interviewd_staff_code": "", "tipvempcode": "",
    "dipvverificationdt": "", "osv_date": "", "interviewed_date": "", "lipvbranchid": "", "tipvverplace": "",
    "country_of_res": "", "country_of_res_oth": "", "country_src_income": "", "country_src_income_oth": "",
    "invstmnt_thrgh_shrkhn": "", "nature_of_bus_desc": "", "kmp_desg_id": "", "access_insider_info": "",
    "access_insider_info_rmrks": "", "usg_sensitv_prdcts_servcs": "", "kmp_desg_desc": "", "former_aliasesname": "",
    "citizenship": "", "is_bank_available": "", "ipv_name": "", "osv_name": "", "interviewer_name": "",
    "ipv_desg": "", "osv_desg": "", "interviewer_desg": "", "ipv_sign_path": "", "osv_sign_path": "",
    "ipv_interviewer_path": "", "modified_on": "", "is_prior_investment_expirience": "",
    "investment_expirience_yrs": "", "expirience_in_derivatives_yrs": "", "other_investment_fields_expirience_yrs": "",
    "factiva_upload_path": "" } ],
  "Description": "" }
```

### Controller response (always 200)

```json
{ "message": "Extra Details loaded successfully", "data": { "form_entry_id": 100045, "...": "..." } }
```

On failure `data` is an empty model (`form_entry_id: 0`, other fields null). An empty id returns 400 `"Invalid data."`.

> On read, the interviewer signature comes back as `ipv_interviewer_path`, while on save it is sent as `interviewer_sign_path`.

---

## 3. SaveSDKImage (face-liveliness result)

`POST /Onboarding/ExtraDetails/SaveSDKImage` with a JSON body. **No anti-forgery check**, because it is called from the public `capturedetails` page.

### Request (`SDKResponseModel`)

```json
{
  "formentryid": "100045", "formno": "NRI000123", "panNo": "ABCDE1234F", "holderType": "1",
  "isValid": true, "remark": "", "uniqueId": "", "live": "true", "livenessScore": "0.98", "datetime": "",
  "requestId": "req-123", "city": "", "state": "", "country": "", "latitude": "", "longitude": "",
  "ageRange": "25-30", "gender": "M", "allowException": false,
  "croppedImageBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### Step 1: save the image

The image is saved to `{networkFolder}\{formno}_{PANNO}\Cust_{requestId}_{yyyyMMddHHmmss}.jpg`.

### Step 2: downstream call

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SaveLivelinessDetails
Authorization: Bearer <OpenAccountService token>
```

```json
{
  "FormEntryID": "100045", "FormNumber": "NRI000123",
  "SelfieImage": "NRI000123_ABCDE1234F\\Cust_req-123_20250101120000.jpg",
  "Live": "true", "LivenessScore": "0.98", "RequestId": "req-123",
  "SecurityCity": "", "SecurityCountry": "", "SecurityState": "",
  "SecurityLatitude": "", "SecurityLongitude": "",
  "AgeRange": "25-30", "Gender": "M",
  "IPAddress": "<X-Forwarded-For or RemoteIpAddress>",
  "HolderType": "1"
}
```

Response: any 2xx, or `errorresponse`.

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Success | 200 | `{ "status": "Success", "message": "Image and liveliness details saved successfully", "imagePath": "..." }` |
| No image | 400 | `{ "status": "Error", "message": "Image data missing" }` |
| Image write failed | 500 | `{ "status": "Error", "message": "Failed to save image to file system", "description": "<ex>" }` |
| Downstream 401 | 401 | `{ "status": "Error", "message": "...", "description": "...", "imagePath": "..." }` |
| Downstream error | downstream code | `{ "status": "Error", "message": "Image saved but failed to save liveliness details", "description": "...", "imagePath": "..." }` |
| Downstream exception | 500 | `{ "status": "PartialSuccess", "message": "Image saved but error occurred while saving liveliness details", "description": "...", "imagePath": "..." }` |

> `SelfieImage` is built with `Path.Combine`, so it contains a back-slash (`\`), while every other stored path uses `/`.

---

## 4. SendEmailForLivelinessCheck

`POST /Onboarding/ExtraDetails/SendEmailForLivelinessCheck` with a JSON body.

### Request (`sendEmailModelforlivelinesscheck`)

```json
{
  "To": ["customer@example.com"], "CC": [], "BCC": [], "FilesPath": [], "FilesName": [],
  "Subject": "(ignored)", "Body": "(ignored)",
  "FormNumber": "NRI000123", "ReferenceNumber": "100045"
}
```

### Processing

* `FormNumber` and `ReferenceNumber` are each AES-GCM encrypted with `checkpage:AESKey` and `AppSettings:IV`.
* The HTML body is generated with a CTA link `{AppSettings:ApplicationBaseUrl}/Onboarding/nriaccountopening2/capturedetails?formNo=<enc>&skrefno=<enc>` (the base URL defaults to `http://localhost:5007`).

### Downstream

```
POST {baseurl}CommunicationService/Email/v2/SendMail
Authorization: Bearer <CommunicationService token>
```

```json
{
  "to": ["ashutosh.ainext@sharekhan.com"],
  "cc": [], "bcc": [], "filesPath": [], "filesName": [],
  "subject": "Face Liveliness Verification Required - KYC Onboarding",
  "body": "<!DOCTYPE html>..."
}
```

### Controller response (HTTP 200)

```json
{ "isValid": true, "message": "Email sent successfully.", "description": "" }
```

Failures: `isValid: false` with `message` = `"Invalid request data or email recipient not provided."`, `"Authentication failed."`, `"You are not authorized..."`, the downstream `Message` or `"Internal server error: ..."`.

> ⚠ **Hard-coded recipient:** `to` is always `ashutosh.ainext@sharekhan.com`, and `request.To` is ignored (it is used only in logs). This is a developer test override and must be fixed before release.
>
> ⚠ The link format here (`?formNo=&skrefno=`) does not match what `capturedetails` expects (`?q=<cipher>.<iv>`). No script under `wwwroot` calls this action. The UI (`wwwroot/pages/sendlivelinessnotification.js`) uses `NRIAccountOpening/SendLivelinessMail` instead, so this action looks unused.

---

## 5. UploadFile (IPV document)

`POST /Onboarding/ExtraDetails/UploadFile` with `multipart/form-data`: `signproofFile`, `formno`, `panno`.

Saved as `{networkFolder}\{formno}_{panno}\IPV_details_{formno}_{panno}_{yyyyMMddHHmmss}{ext}`. There is no type or size validation.

```json
{ "success": true, "fileName": "IPV_details_...pdf", "filePath": "NRI000123_ABCDE1234F/IPV_details_...pdf", "savePath": "..." }
```

No file: 400 `{ "message": "No file selected." }`

---

## 6. GetesigndetailsDetails (employee signature from TAB)

`POST /Onboarding/ExtraDetails/GetesigndetailsDetails` with a raw JSON string body, for example `"E123"` (employee code).

### Downstream 1: TAB token

```
POST {TAB:getToken}
{ "UserName": "<TAB:UserName>", "Password": "<TAB:Password>" }
→ { "Data": { "Token": "..." } }
```

### Downstream 2: employee signature

```
GET {TAB:GetEmpSign}?empCode=E123
Authorization: Bearer <TAB token>
```

Response (`EmployeeResponse`):

```json
{ "Message": "Success", "Data": { "EmpName": "", "EmpDesig": "", "EmpCode": "E123", "EmpSign": "<base64 image / path>" }, "Description": "" }
```

### Controller response (always 200)

```json
{ "message": "Extra Details loaded successfully", "data": { "Message": "Success", "Data": { "EmpName": "", "EmpDesig": "", "EmpCode": "", "EmpSign": "" }, "Description": "" } }
```

On failure `data` is `null`. An empty code returns 400 `"Invalid data."`.
