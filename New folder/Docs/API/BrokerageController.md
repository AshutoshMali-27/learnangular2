# BrokerageController

**File:** `Controllers/BrokerageController.cs`  
**Route prefix:** `/Onboarding/Brokerage/{action}`  
**Purpose:** Brokerage scheme selection for the form (stage 10).

All actions require the anti-forgery token. Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | Downstream API |
|---|---|---|
| 1 | `GetBrokerageSchemeNames` | `OpenAccountService/api/v1/AccountStaging/GetBrokerageSchemeNames` |
| 2 | `SaveBrokerage` | `OpenAccountService/api/v1/AccountStaging/SetBrokerageID` |
| 3 | `GetBrokerage` | `OpenAccountService/api/v1/AccountStaging/GetBrokerageID` |

The tariff details of a scheme are loaded separately through `NRIAccountOpening/GetBrokerageData` (see [NRIAccountOpeningController.md](NRIAccountOpeningController.md#14-getbrokeragedata)).

---

## 1. GetBrokerageSchemeNames

`POST /Onboarding/Brokerage/GetBrokerageSchemeNames` with no body.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetBrokerageSchemeNames
{}
```

Response (`ClsValidateResponse`, `Data` is a plain array):

```json
{ "Status": "Success", "Message": "", "Data": [ { "BrokerageSchemeName": "Classic", "BrokerageSchemeID": "1" } ], "Description": "" }
```

### Controller response (always 200)

```json
{ "message": "Form saved successfully", "data": [ { "BrokerageSchemeName": "Classic", "BrokerageSchemeID": "1" } ] }
```

On failure `data` is an empty array (the error is only logged). The fixed `message` text is misleading.

---

## 2. SaveBrokerage

`POST /Onboarding/Brokerage/SaveBrokerage` with a JSON body.

### Request (`BrokerageSaveRequest`, forwarded as-is)

```json
{ "FormEntryID": "100045", "BrokerageID": "1", "EmployeeCode": "E123" }
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetBrokerageID
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response (200)

```json
{ "Description": "", "message": "Success" }
```

On failure `message` and `Description` come from the downstream `errorresponse`. A null body returns 400 `"Invalid data."`.

---

## 3. GetBrokerage

`POST /Onboarding/Brokerage/GetBrokerage` with a raw JSON string body, for example `"100045"`.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetBrokerageID
{ "FormEntryID": "100045" }
```

Response (`ClsValidateResponse`; `Data` is an object):

```json
{ "Status": "Success", "Data": { "CreatedModifiedBy": "", "CreatedModifiedOn": "", "BrokerageID": "1" }, "Description": "" }
```

### Controller response (always 200)

```json
{ "message": "Extra Details loaded successfully", "data": { "CreatedModifiedBy": "", "CreatedModifiedOn": "", "BrokerageID": "1" } }
```

On failure `data` is an empty `GetBrokerageResponse` with null fields. An empty id returns 400 `"Invalid data."`.
