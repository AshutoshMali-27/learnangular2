# BankDetailController

**File:** `Controllers/BankDetailController.cs`  
**Route prefix:** `/Onboarding/BankDetail/{action}`  
**Purpose:** Bank account details (NRE/NRO): IFSC lookup, save/load bank details, penny-drop / bank check and cheque-leaf upload.

All actions require the anti-forgery token. Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `GetIfscList` | POST | `OpenAccountService/api/v2/Master/GetMaster` (11) |
| 2 | `SavebankDetails` | POST (form) | `OpenAccountService/api/v1/AccountStaging/SetBankDetails` |
| 3 | `getbankdeytailsonformid` | POST | `OpenAccountService/api/v1/AccountStaging/GetBankDetails` |
| 4 | `CheckBank` | POST | `OpenAccountService/api/v1/Account/CheckBank` |
| 5 | `UploadChequeLeaf` | POST (multipart) | – (file share) |

---

## 1. GetIfscList

`POST /Onboarding/BankDetail/GetIfscList` with a JSON body.

```json
{ "masterCode": "11", "parameter1": "HDFC0000001" }
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v2/Master/GetMaster
{ "masterCode": 11, "parameter1": "HDFC0000001", "parameter2": "", "parameter3": "", "parameter4": "", "parameter5": "" }
```

Response: encrypted envelope → `List<BankIfscModel>`.

### Controller response (200)

```json
[{
  "Id": "", "Name": "", "DisplayText": "", "Bank_Name": "HDFC BANK", "Bank_Branch_Name": "FORT",
  "Bank_Id": "12", "Bank_Branch_Id": "3456", "Micr_Code": "400240002", "IsRtgs": "Y", "IsNeft": "Y"
}]
```

Errors: `{ "success": false, "message": "Invalid request." | "You are not authorized. Please log in again." | "Failed to fetch IFSC list." | "Decryption failed: ..." | "Internal server error: ...", "status": <code> }`

---

## 2. SavebankDetails

`POST /Onboarding/BankDetail/SavebankDetails` with `application/x-www-form-urlencoded` / `multipart/form-data`, bound with `[FromForm] BankDetailsRequest` (indexed form keys such as `BankDetails[0].AccountNumber`).

### Request (`BankDetailsRequest`, forwarded to the downstream as JSON)

```json
{
  "employeePanNo": "ABCDE1234F",
  "employeeformno": "NRI000123",
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "BankDetails": [{
    "BankBranchID": "3456",
    "AccountType": "1",
    "AccountNumber": "000123456789",
    "MicrCode": "400240002",
    "IfscCode": "HDFC0000001",
    "IsDefault": "Y",
    "NriType": "NRE",
    "TransactionReferenceNumber": "",
    "UpiID": "",
    "ChequeLeafUploadFlag": "Y",
    "ChequeLeafUploadPath": "NRI000123_ABCDE1234F/CHEQUELEAF_20250101120000.jpg",
    "RBIReferenceNumber": "",
    "RBIApprovalDate": ""
  }]
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetBankDetails
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Downstream 2xx | 200 | `{ "message": "<Status>", "Description": "<Description>" }` |
| Downstream error | 200 | `{ "message": "<Message>", "Description": "<Description or 'All fields are required to be filled.'>" }` |
| Null model | 400 | `"Invalid data."` |
| Exception | 400 | `{ "status": "Error", "message": "<ex>" }` |

---

## 3. getbankdeytailsonformid

`POST /Onboarding/BankDetail/getbankdeytailsonformid` with a raw JSON string body, for example `"100045"`.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetBankDetails
{ "FormEntryID": "100045" }
```

Response (`BankApiResponse`):

```json
{
  "Status": "Success",
  "Data": [{
    "BankBranchID": 3456, "AccountType": 1, "AccountNumber": "000123456789", "MicrCode": "", "IfscCode": "HDFC0000001",
    "IsDefault": 1, "NriType": "NRE", "TransactionReferenceNumber": "", "UpiID": "",
    "ChequeLeafUploadPath": "", "ChequeLeafUpoloadFlag": "Y", "RBIReferenceNumber": null,
    "CreatedModifiedBy": 1, "CreatedModifiedOn": "", "RBIApprovalDate": ""
  }],
  "Description": ""
}
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Data found | 200 | `{ "message": "Bank details loaded successfully", "data": [ BankDetailresponse ] }` |
| No data | 200 | `{ "message": "No bank details found.", "data": [] }` |
| Empty id | 400 | `{ "status": "Error", "message": "Invalid FormEntryID." }` |
| 401 | 401 | `{ "message": "...", "Description": "Token expired or invalid." }` |
| Other | downstream code | `{ "message": "...", "Description": "..." }` |
| Exception | 500 | `{ "message": "Error", "Description": "<ex>" }` |

---

## 4. CheckBank

`POST /Onboarding/BankDetail/CheckBank` with a JSON body.

### Request (`checkbankrequest`)

```json
{ "PanNo": "ABCDE1234F", "AccountNo": "000123456789", "IfscCode": "HDFC0000001", "BankBranchId": "3456", "AccountType": "1" }
```

`AppName` and `NriType` from the client are ignored.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/Account/CheckBank
{ "AppName": "DIY", "PanNo": "ABCDE1234F", "AccountNo": "000123456789", "IfscCode": "HDFC0000001",
  "BankBranchId": "3456", "NriType": "", "AccountType": "1" }
```

Response (`VerifybankResponseModel`), returned as-is:

```json
{ "Message": "Success", "Data": { "...": "bank verification result" }, "Description": "" }
```

### Controller error responses (HTTP 200)

```json
{ "success": false, "message": "You are not authorized to perform this action. Please log in again.", "status": 401 }
```

```json
{ "Message": "Failed", "Data": "<raw downstream body>", "status": 500 }
```

---

## 5. UploadChequeLeaf

`POST /Onboarding/BankDetail/UploadChequeLeaf` with `multipart/form-data`.

| Field | Notes |
|---|---|
| (first file in form) | cheque leaf image/PDF (no type or size validation) |
| `formno` | |
| `panno` | upper-cased |

Saved as `{networkFolder}\{formno}_{PANNO}\CHEQUELEAF_{yyyyMMddHHmmss}{ext}`.

```json
{ "success": true, "fileName": "<original file name>", "filePath": "NRI000123_ABCDE1234F/CHEQUELEAF_20250101120000.jpg" }
```

Errors: 400 `{ "success": false, "message": "No file uploaded." | "<ex>" }`
