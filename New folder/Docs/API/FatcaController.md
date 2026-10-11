# FatcaController

**File:** `Controllers/FatcaController.cs`  
**Route prefix:** `/Onboarding/Fatca/{action}`  
**Purpose:** FATCA / CRS declaration: save and load FATCA data, TIN-structure validation (CISCore), PEP and TIN proof uploads, and the FATCA masters.

Two HTTP clients are used:

* `client` → `{baseurl}` (OpenAccountService), with the OpenAccountService bearer token
* `client2` → `{baseurl2}` (CISCore), with the CISCore bearer token (`GenerateTokenUsingStoredCredentialsforciscore`)

All actions require the anti-forgery token.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `UploadFile` | POST (multipart) | – (file share) |
| 2 | `GetUploadedFile` | GET | – (file share) |
| 3 | `getNationalitylist` | POST | `v2/Master/GetMaster` (19) |
| 4 | `getnatureofbusinesslist` | POST | `v2/Master/GetMaster` (44) |
| 5 | `getfatcasourceofwelth` | POST | `v2/Master/GetMaster` (client-supplied) |
| 6 | `SaveFatcaData` | POST | `OpenAccountService/api/v1/AccountStaging/SetFatcaDetails` |
| 7 | `getFatcaonformid` | POST | `OpenAccountService/api/v1/AccountStaging/GetFetchDetails` |
| 8 | `ValidateResidency1` | POST | `{baseurl2}api/DigitalCMC/VerifiyTINStructure` |
| 9 | `ValidateResidency2` | POST | `{baseurl2}api/DigitalCMC/VerifiyTINStructure` |
| 10 | `ValidateResidency3` | POST | `{baseurl2}api/DigitalCMC/VerifiyTINStructure` |
| 11 | `GetExistingCustomerDetailsforfatca` | POST | `OpenAccountService/api/v1/NRI/GetExistingCustomerDetails` |
| 12 | `UploadPEPFile` | POST (multipart) | – (file share) |
| 13 | `getCitymasterforfatca` | POST | `v2/Master/GetMaster` (45) |
| 14 | `getfatcaCountrymaster` | POST | `v2/Master/GetMaster` (50) |

---

## 1. UploadFile (TIN proof)

`POST /Onboarding/Fatca/UploadFile` with `multipart/form-data`.

| Field | Type |
|---|---|
| `signproofFile` | file |
| `formno` | string |
| `panno` | string |

Saved as `{networkFolder}\{formno}_{panno}\fatca_tin_{formno}_{panno}_{yyyyMMddHHmmss}{ext}`.

```json
{ "success": true, "fileName": "fatca_tin_...pdf", "filePath": "NRI000123_ABCDE1234F/fatca_tin_...pdf", "savePath": "\\\\share\\...\\fatca_tin_...pdf" }
```

No file: 400 `{ "message": "No file selected." }`

## 2. GetUploadedFile

`GET /Onboarding/Fatca/GetUploadedFile?formno=&panno=&fileName=`

Returns the file bytes from `{networkFolder}\{formno}_{panno}\{fileName}`. 404 `"File not found."`; 400 `{ "Success": false, "Message": "<ex>" }`.

---

## 3. getNationalitylist

`POST /Onboarding/Fatca/getNationalitylist`

```json
{ "masterCode": "19", "parameter1": "<filter>" }
```

Downstream `v2/Master/GetMaster`: `{ "masterCode": 19, "parameter1": "<request.parameter1>", "parameter2..5": "" }`

Response:

```json
[ { "country_name": "INDIA", "country_code": "IN" } ]
```

## 4. getnatureofbusinesslist

`POST /Onboarding/Fatca/getnatureofbusinesslist` with a `masterrequest` body (only checked for null). masterCode **44**.

Response: `[ { "SERIALNO": 1, "DESCRIPTION": "Trading" } ]`

## 5. getfatcasourceofwelth

`POST /Onboarding/Fatca/getfatcasourceofwelth`. The client's `masterrequest` is **forwarded unchanged** to `v2/Master/GetMaster`:

```json
{ "masterCode": "<source-of-wealth code>", "parameter1": "", "parameter2": "", "parameter3": "", "parameter4": "", "parameter5": "" }
```

Response: `[ { "fsw_code": "01", "fsw_sourceofwealth": "Salary" } ]`

Errors for #3–5: `{ "success": false, "message": "You are not authorized. Please log in again." | "Failed to fetch ..." | "Decryption failed: ..." | "Internal server error: ...", "status": <code> }`

---

## 6. SaveFatcaData

`POST /Onboarding/Fatca/SaveFatcaData` with a JSON body.

### Request (`FatcaDetailsRequest`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "FatcaData": [{
    "FormEntryID": 100045,
    "HOLDERTYPE": "1", "EMPLOYER_NAME": "", "EMPLOYER_ADDRESS": "", "EMPLOYER_COUNTRY": "",
    "PEKRN": "", "DATA_SRC": "", "ADDR_TYPE": "", "PO_BIR_INC": "", "CO_BIR_INC": "",
    "TAX_RES1": "", "TPIN1": "", "ID1_TYPE": "", "FROM_DATE1": "", "TIN1_PROOF_PATH": "",
    "TAX_RES2": "", "TPIN2": "", "ID2_TYPE": "", "FROM_DATE2": "", "TIN2_PROOF_PATH": "",
    "TAX_RES3": "", "TPIN3": "", "ID3_TYPE": "", "FROM_DATE3": "", "TIN3_PROOF_PATH": "",
    "TAX_RES4": "", "TPIN4": "", "ID4_TYPE": "", "FROM_DATE4": "", "TIN4_PROOF_PATH": "",
    "SRCE_WEALT": "", "SRCE_WEALT_OTH": "", "CORP_SERVS": "", "INC_SLAB_ID": "", "NET_WORTH": "", "NW_DATE": "",
    "PEP_FLAG": "", "PEP_DETAILS": "", "PEP_APPROVAL_UPLOAD_PATH": "", "OCC_ID": "", "OCC_OTHER_NAME": "",
    "EXEMP_CODE": "", "FFI_DRNFE": "", "GIIN_NO": "", "SPR_ENTITY": "", "GIIN_NA": "", "GIIN_EXEMC": "", "GIIN_STATUS": "",
    "NFFE_CATG": "", "ACT_NFE_SC": "", "NATURE_BUS": "", "REL_LISTED": "", "EXCH_NAME": "", "PUBLIC_TRADE_NAME_EXCH": "",
    "UBO_APPL": "", "UBO_COUNT": "", "UBO_NAME": "", "UBO_PAN": "", "UBO_NATION": "", "UBO_ADD1": "", "UBO_ADD2": "",
    "UBO_ADD3": "", "UBO_CITY": "", "UBO_PIN": "", "UBO_STATE": "", "UBO_CNTRY": "", "UBO_ADD_TY": "", "UBO_CTR": "",
    "UBO_TIN": "", "UBO_ID_TY": "", "UBO_COB": "", "UBO_DOB": "", "UBO_GENDER": "", "UBO_FR_NAM": "", "UBO_OCC": "",
    "UBO_OCC_TY": "", "UBO_TEL": "", "UBO_MOBILE": "", "UBO_CODE": "", "UBO_HOL_PC": "", "UBO_DF": "",
    "UBO_US_PERSON_FLG": "", "UBO_RES_STATUS": "", "UBO_CUSTOMER_ID": "", "UBO_CONTRY_BIRTH": "", "UBO_CITIZEN": "",
    "SDFLAG": "", "LOG_NAME": "", "FILLER1": "", "FILLER2": "",
    "FOREIGN_EXCH_FLG": "", "MONEY_LENDING_FLG": "", "GAMBLING_FLG": "", "TAX_RES_OTH_CNTRY_FLG": "",
    "NATURE_ORELATION": "", "DP_ID": "", "OTHER_DETAILS": "", "US_PERSON_FLG": "", "DATE_OF_INC": "",
    "OTH_REPORT_PERSON": "", "FINANCIAL_INS": "", "PARTICIPATING_FFI": "", "REP_MOD_FFI1": "", "REP_MOD_FFI2": "",
    "ACC_TY_US_PERSON": "", "NATIONALITY": "", "COUNTRY_OF_RESIDENCE": "", "CITIZENSHIP": ""
  }]
}
```

UI-only fields marked `[JsonIgnore]` (`NATIONALITY1`, `OCC_TEXT`, `INC_SLAB_TEXT`, `countryOfBirth_text`, `HOLDERTYPE_text`, `NATIONALITY1_text`) are dropped before the downstream call.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetFatcaDetails
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Downstream 2xx | 200 | `{ "message": "<Status>", "Description": "<Description>" }` |
| Downstream error | 200 | `{ "message": "<Message>", "Description": "<Description or 'All fields are required to be filled.'>" }` |
| Null body | 400 | `"Invalid data."` |
| Exception | 500 | `{ "message": "Error", "Description": "<ex>" }` |

---

## 7. getFatcaonformid

`POST /Onboarding/Fatca/getFatcaonformid` with a raw JSON string body, for example `"100045"`.

Downstream: `POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetFetchDetails` with `{ "FormEntryID": "100045" }`

Response (`fatcadetailresponsemodel`, not encrypted). The item model `fatcadetailresponse` names most FATCA fields from #6 in **snake/lower case** (`holdertype`, `pekrn`, `tax_res1`, `tpin1`, …, `ubo_*`; `SDFLAG` arrives as `sdf_flag`). Json.NET matches property names case-insensitively, so the backend may send either casing. It also carries:

| Extra field in model | Meaning |
|---|---|
| `form_entry_id` | Form entry id |
| `nationality`, `nationality_id` | Nationality code / id |
| `occ_name`, `inc_slab`, `fatca_nationality`, `co_nationality_name` | Display names |
| `EMPLOYER_NAME`, `TIN1..4_PROOF_PATH`, `PEP_APPROVAL_UPLOAD_PATH`, `COUNTRY_OF_RESIDENCE`, `CITIZENSHIP`, `EMPLOYER_ADDRESS`, `EMPLOYER_COUNTRY`, `OCC_OTHER_NAME`, `FROM_DATE1..4`, `SRCE_WEALT_OTH` | Same names as the save request |

```json
{ "status": "Success", "data": [ { "form_entry_id": 100045, "holdertype": "1", "tax_res1": "US", "tpin1": "123456789", "...": "..." } ], "description": "" }
```

### Controller response (200)

Each item is re-mapped to `FatcaDetailforresponse`, which uses the same **UPPER-CASE** names as the save request (#6), plus `FormEntryID`, `nationality_id`, `occ_name`, `inc_slab`, `fatca_nationality` and `co_nationality_name`:

```json
{ "message": "Data fetched successfully", "data": [ { "HOLDERTYPE": "1", "TAX_RES1": "US", "TPIN1": "123456789", "FormEntryID": 100045, "...": "..." } ] }
```

| Case | HTTP | Body |
|---|---|---|
| Empty id | 400 | `"FormEntryID is required."` |
| 401 | 401 | – |
| Other | downstream code | `"Error fetching FATCA details"` |
| Exception | 500 | `"Internal server error"` / `"Token generation failed."` |

> ⚠ The mapping swaps the two nationality fields: `NATIONALITY = item.nationality_id` and `nationality_id = item.nationality`.

---

## 8–10. ValidateResidency1 / 2 / 3 (TIN structure check)

`POST /Onboarding/Fatca/ValidateResidency{n}` with a JSON body.

### Request (`ResidencyValidationRequest`)

```json
{ "appname": "", "Country_Code1": "US", "TIN1": "123456789", "Country_Code2": "", "TIN2": "", "Country_Code3": "", "TIN3": "" }
```

| Action | Fields used |
|---|---|
| `ValidateResidency1` | `Country_Code1`, `TIN1` |
| `ValidateResidency2` | `Country_Code2`, `TIN2` |
| `ValidateResidency3` | `Country_Code3`, `TIN3` |

### Downstream (CISCore)

```
POST {baseurl2}api/DigitalCMC/VerifiyTINStructure
Authorization: Bearer <CISCore token>
```

All three actions send the chosen pair in **slot 1**:

```json
{ "appName": "KR", "COUNTRY_CODE1": "US", "TIN1": "123456789", "COUNTRY_CODE2": "", "TIN2": "", "COUNTRY_CODE3": "", "TIN3": "" }
```

Response (`ResidencyValidationResponse`):

```json
{ "Message": "Valid TIN", "Data": { "TIN1Response": "", "TIN2Response": "", "TIN3Response": "" }, "DDescriptionata": "" }
```

### Controller response (HTTP 200)

```json
{ "isValid": true, "message": "Valid TIN" }
```

* `isValid` is true when `Data != null`.
* Failures: `{ "isValid": false, "message": "Country ID and TIN are required." | "You are not authorized. Please log in again." | "<error message>" | "Internal server error: ..." }`
* An anti-forgery failure returns the standard `{ success, message }` body with HTTP 400.

---

## 11. GetExistingCustomerDetailsforfatca

`POST /Onboarding/Fatca/GetExistingCustomerDetailsforfatca`

```json
{ "panNo": "ABCDE1234F", "searchText": "FATCA", "skReferenceNo": "", "nriType": "" }
```

Downstream: `POST {baseurl}OpenAccountService/api/v1/NRI/GetExistingCustomerDetails`

```json
{ "appName": "ONEKYC", "searchText": "FATCA", "panNo": "ABCDE1234F", "skReferenceNo": "", "nriType": "" }
```

Response: encrypted envelope → `List<FatcaDetailforresponse>`.

Controller response: `{ "success": true, "statedetails": [ FatcaDetailforresponse ] }`, or `{ "success": false, "message": "...", "status": <code> }`.

---

## 12. UploadPEPFile

`POST /Onboarding/Fatca/UploadPEPFile` with `multipart/form-data`.

| Field | Type | Rules |
|---|---|---|
| `proofFile` | file | ≤ 5 MB; `.jpg .jpeg .png .pdf .eml` |
| `formno` | string | |
| `pepFlag` | string | logged only |
| `panno` | string | |

Saved as `{networkFolder}\{formno}_{panno}\pep_approval_{formno}_{yyyyMMddHHmmss}{ext}`.

```json
{ "success": true, "fileName": "pep_approval_...pdf", "filePath": "NRI000123_ABCDE1234F/pep_approval_...pdf", "savePath": "...", "message": "PEP approval document uploaded successfully." }
```

Errors: 400 `{ success: false, message: "No file selected." | "File size must not exceed 5MB." | "Invalid file format..." }`; 500 on I/O error.

---

## 13. getCitymasterforfatca

`POST /Onboarding/Fatca/getCitymasterforfatca` with a `masterrequest` body (ignored). masterCode **45**, no parameter.

Response: `[ { "city_id": "", "city_name": "" } ]`

## 14. getfatcaCountrymaster

`POST /Onboarding/Fatca/getfatcaCountrymaster` (query params ignored). masterCode **50**.

Response: `[ { "country_id": "", "country_name": "", "fatca_country_code": "" } ]`

---

## Observations

* `GetUploadedFile` builds the path from the raw `fileName` (no `Path.GetFileName`), so `..\` segments can reach files outside the form folder. Sanitise the name.
* `getfatcasourceofwelth` lets the client choose any `masterCode`.
* The nationality fields are swapped in `getFatcaonformid` (see #7).
