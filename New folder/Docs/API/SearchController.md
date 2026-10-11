# SearchController

**File:** `Controllers/SearchController.cs`  
**Route prefix:** `/Onboarding/Search/{action}`  
**Purpose:** Global user search.

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `Search` | GET | `GET {baseurl}Dashboard/GetSearchData` |

---

## 1. Search

`GET /Onboarding/Search/Search?searchInput=john`

No anti-forgery check and no session check.

### Downstream

```
GET {baseurl}Dashboard/GetSearchData?searchInput=john
(no Authorization header)
```

Response: `List<UserMasterViewModel>`

```json
[{
  "SrNo": 1, "UserId": 10, "UserName": "john", "Password": "", "EmailId": "", "Mobile": "", "RoleId": 1,
  "EmpCode": "", "BranchCode": "", "Designation": "", "BranchLocation": "", "IsActive": 1,
  "AllowDownloadData": 0, "MASK_Access": 1, "MACM_Access": 1, "CreatedOn": "", "CreatedBy": 1,
  "Role": "", "Flag": "", "Unmaskpi": 0, "FullName": ""
}]
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| Success | 200 | the list above (passed through) |
| Empty `searchInput` | 400 | `"Please provide a search input."` |
| Downstream non-2xx | 200 | `"False"` |
| Exception | 200 | `""` |

> ⚠ The `searchInput` value is not URL-encoded, the downstream call has no auth, and the response model includes a `Password` field that is passed straight to the browser.
