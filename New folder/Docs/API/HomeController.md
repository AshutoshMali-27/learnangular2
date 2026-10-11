# HomeController

**File:** `Controllers/HomeController.cs`  
**Route prefix:** `/Onboarding/Home/{action}`  
**Purpose:** Dashboard landing page, NRI form-number generation, form-version master and dashboard counts.

All downstream URLs in this controller are read from configuration (`AllocatedForms:*`, `Dashboard:*`). Every call uses the private helper `SendRequest(url, token, body)`, which POSTs JSON with `Authorization: Bearer <OpenAccountService token>` and returns the parsed body as `dynamic`.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `Index` | GET | – |
| 2 | `generateform` | GET | – |
| 3 | `CreateForm` | POST | `OpenAccountService/api/v1/NRI/GenerateNRIFormNumber` |
| 4 | `Privacy` | GET | – |
| 5 | `getformversionmaster` | POST | `OpenAccountService/api/v1/Master/GetMaster` (masterCode 32) |
| 6 | `Error` | GET | – |
| 7 | `GetDashboardCounts` | POST | `OpenAccountService/api/v1/NRI/GetDashboardCounts` |

---

## 1. Index (view)

`GET /Onboarding/Home/Index`. Redirects to `Auth/Login` when session `empId` is missing. `ViewBag.empname` and `ViewBag.branchtypecode` come from the session.

## 2. generateform (view)

`GET /Onboarding/Home/generateform`. Requires a session.

---

## 3. CreateForm

`POST /Onboarding/Home/CreateForm` with `Content-Type: application/json`. Anti-forgery is required.

### Controller request (`FormGenerateRequest`)

```json
{ "documentVerId": "5" }
```

`branchId` and `loggedInUser` are overwritten from the session (`branchId`, `empId`).

### Downstream

```
POST {baseurl}{AllocatedForms:CreateFormURL}
   = {baseurl}OpenAccountService/api/v1/NRI/GenerateNRIFormNumber
Authorization: Bearer <OpenAccountService token>
```

```json
{ "branchId": "<session branchId>", "documentVerId": "5", "loggedInUser": "<session empId>" }
```

Response: encrypted envelope. Decrypted payload:

```json
[{ "Form_Number": "NRI000123" }]
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Success | 200 | `{ "status": "Success", "data": { "FormNumber": "NRI000123" }, "description": "" }` |
| Any error | 400 | `{ "status": "Failed", "data": [], "description": "Error occured when generating form" }` |

---

## 4. Privacy (view)

`GET /Onboarding/Home/Privacy`. Checks session `UserId`, a key that is never set, so this action always redirects to Login.

---

## 5. getformversionmaster

`POST /Onboarding/Home/getformversionmaster` with no body. Anti-forgery is required.

### Downstream

```
POST {baseurl}{AllocatedForms:FromVersionMasterURL}
   = {baseurl}OpenAccountService/api/v1/Master/GetMaster        (note: v1)
Authorization: Bearer <OpenAccountService token>
```

```json
{ "masterCode": "32", "parameter1": "NRI", "parameter2": "<session branchId>",
  "parameter3": "", "parameter4": "", "parameter5": "" }
```

Response: encrypted envelope (`Message` must be `"Success"`). The decrypted payload is passed through untouched as a `JsonNode`. The app has no C# model for it, so its shape is defined by the backend. The UI (`generateform.js`) reads `[{ "DOC_VER_ID": ..., "DOC_VER_NAME": "..." }]`, and `DOC_VER_ID` is posted back as `documentVerId` in `CreateForm`.

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Success | 200 | `{ "status": "Success", "data": <decrypted JSON>, "description": "" }` |
| Failure | 400 | `{ "status": "Failed", "Data": [], "description": "Failed to fetch Form Version master" }` |

---

## 6. Error (view)

`GET /Onboarding/Home/Error`. Returns `ErrorViewModel { RequestId }`.

---

## 7. GetDashboardCounts

`POST /Onboarding/Home/GetDashboardCounts` with no body. **No anti-forgery check.**

### Downstream

```
POST {baseurl}{Dashboard:GetDashboardCountsURL}
   = {baseurl}OpenAccountService/api/v1/NRI/GetDashboardCounts
Authorization: Bearer <OpenAccountService token>
```

```json
{ "BranchID": "<session branchId>" }
```

Response (plain, not encrypted):

```json
{ "Message": "Success", "Data": { "...counts by status...": 0 }, "Description": "" }
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Success | 200 | `{ "status": "Success", "data": <Data as JSON>, "description": "" }` |
| Failure | 400 | `{ "status": "Failed", "data": [], "description": "Error in getting Dashboard Counts" }` |
