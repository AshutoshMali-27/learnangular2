# ProofController

**File:** `Controllers/ProofController.cs`  
**Route prefix:** `/Onboarding/Proof/{action}`  
**Purpose:** Identity / address proof documents: upload, view, delete, save proof metadata and the document-type master.

All actions require the anti-forgery token (including the GET actions). Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `SaveProofDetails` | POST | `OpenAccountService/api/v1/AccountStaging/SetProofDetails` |
| 2 | `getdocumentmaster` | POST | `OpenAccountService/api/v2/Master/GetMaster` (18) |
| 3 | `GetProofDetails` | POST | `OpenAccountService/api/v1/AccountStaging/GetProofDetails` |
| 4 | `GetDocument` | GET | – (file share) |
| 5 | `DeleteDocument` | POST | – (file share) |
| 6 | `UploadFile` | POST (multipart) | – (file share) |
| 7 | `GetUploadedProofFile` | GET | – (file share) |

---

## 1. SaveProofDetails

`POST /Onboarding/Proof/SaveProofDetails` with a JSON body.

### Request (`ProofDetailsRequest`, forwarded as-is)

```json
{
  "employeePanNo": "ABCDE1234F",
  "employeeformno": "NRI000123",
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "ProofDetails": [{
    "HolderType": "1",
    "ProofNumber": "P1234567",
    "ProofTypeID": "3",
    "ProofDocTypeName": "Passport",
    "DateOfIssue": "2020-01-01",
    "DateOfExpiry": "2030-01-01",
    "PlaceOfIssue": "Mumbai",
    "IsIdentityProof": "Y",
    "IsAddressProof": "Y",
    "IsIncomeProof": "N",
    "IsSignatureProof": "N",
    "IsNoTradingProof": "N",
    "IsIntroducerProof": "N",
    "IsDirectorProof": "N",
    "IsCorrespondenceAddressProof": "N",
    "IsPermanentAddressProof": "Y",
    "IsProofVerified": "N",
    "ProofPath": "NRI000123_ABCDE1234F/proof_NRI000123_ABCDE1234F_20250101120000000000.pdf"
  }]
}
```

`Proofname` is `[JsonIgnore]` and is not sent.

### Validation

* `ProofDetails` must be non-empty → otherwise 400 `{ "status": "Error", "message": "No proof details provided." }`
* Every proof must have `ProofPath` → otherwise 400 `{ "status": "Error", "message": "All proof documents must have uploaded files. Please upload files before saving." }`

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetProofDetails
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response (200)

```json
{ "message": "Success", "Description": "" }
```

Exception → 400 `{ "status": "Error", "message": "Error saving proof details: <ex>" }`

---

## 2. getdocumentmaster

`POST /Onboarding/Proof/getdocumentmaster` with a `masterrequest` body (ignored). masterCode **18**.

Response (`documentmaster[]`):

```json
[{
  "proof_doc_type_id": "3", "proof_doc_type_name": "Passport",
  "havedocnumber": "Y", "havedtofissue": "Y", "havedtofexpiry": "Y", "HAVEPLACEOFISSUE": "Y",
  "isidproof": "Y", "isaddrproof": "Y", "isbankproof": "N"
}]
```

Errors follow the README master pattern.

---

## 3. GetProofDetails

`POST /Onboarding/Proof/GetProofDetails` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetProofDetails` with `{ "FormEntryID": "100045" }`

Response (`proofresponse`):

```json
{ "status": "Success", "data": [ { "HolderType": "1", "ProofNumber": "", "ProofTypeID": "", "DateOfIssue": "", "DateOfExpiry": "", "PlaceOfIssue": "", "IsIdentityProof": "", "IsAddressProof": "", "...": "...", "ProofPath": "", "ProofDocTypeName": "" } ], "description": "" }
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| OK | 200 | `{ "message": "Data fetched successfully", "data": <proofresponse> }` |
| Empty id | 400 | `"FormEntryID is required."` |
| 401 | 401 | – |
| Other | downstream code | `"Error fetching proof details"` |
| Exception | 500 | `"Internal server error"` |

---

## 4. GetDocument

`GET /Onboarding/Proof/GetDocument?path=<relative path>&formNo=&panNo=`

Reads `{networkFolder}\{formNo}_{panNo}\{Path.GetFileName(path)}` and returns the file (pdf / jpeg / png / octet-stream).

400 `"File path is required."`, 404 `"File not found."`, 400 `{ status: "Error", message }`.

## 5. DeleteDocument

`POST /Onboarding/Proof/DeleteDocument` with the form field `path`.

Deletes `{networkFolder}\{Path.GetFileName(path)}`.

```json
{ "status": "Success", "message": "Document deleted successfully." }
```

400 / 404 return `{ "status": "Error", "message": "..." }`.

> ⚠ The `{formNo}_{panNo}` sub-folder is not included in the path, so files saved by `UploadFile` (which live in that sub-folder) are never found, and the action returns 404 for them.

## 6. UploadFile

`POST /Onboarding/Proof/UploadFile` with `multipart/form-data`.

| Field | Rules |
|---|---|
| `proofFile` | `.pdf .jpg .jpeg .png`, ≤ 5 MB |
| `formno` | |
| `panno` | upper-cased |

Saved as `{networkFolder}\{formno}_{PANNO}\proof_{formno}_{PANNO}_{yyyyMMddHHmmssffffff}{ext}`.

```json
{ "success": true, "fileName": "proof_...pdf", "filePath": "NRI000123_ABCDE1234F/proof_...pdf", "savePath": "...", "fileSize": "245.31 KB" }
```

Errors: 400 `{ success: false, message: "No file selected." | "Invalid file format. Please upload PDF, JPG, JPEG, or PNG." | "File size exceeds 5MB limit." | "<ex>" }`

## 7. GetUploadedProofFile

`GET /Onboarding/Proof/GetUploadedProofFile?formno=&panno=&fileName=`

Returns the file bytes from `{networkFolder}\{formno}_{PANNO}\{fileName}`. 404 `"File not found."`

> ⚠ `fileName` is not sanitised (path traversal risk).
