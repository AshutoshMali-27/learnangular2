# OtherDetailsController

**File:** `Controllers/OtherDetailsController.cs`  
**Route prefix:** `/Onboarding/OtherDetails/{action}`  
**Purpose:** Family details (spouse, mother, maiden name, father/husband) and the income-slab master.

All actions require the anti-forgery token. Downstream calls use `Authorization: Bearer <OpenAccountService token>`.

## Summary

| # | Action | Downstream API |
|---|---|---|
| 1 | `SaveFamilyDetails` | `OpenAccountService/api/v1/AccountStaging/SetFamilyDetails` |
| 2 | `GetFamilyDetails` | `OpenAccountService/api/v1/AccountStaging/GetFamilyDetails` |
| 3 | `getIncomeforfamilySlab` | `OpenAccountService/api/v2/Master/GetMaster` (13) |

---

## 1. SaveFamilyDetails

`POST /Onboarding/OtherDetails/SaveFamilyDetails` with a JSON body.

### Request (`FamilyDetailsRequest`, forwarded as-is)

```json
{
  "FormEntryID": "100045",
  "EmployeeCode": "E123",
  "SpouseDetails": {
    "Name": "", "OccupationID": "", "EmployerName": "",
    "AddressLine1": "", "AddressLine2": "", "AddressLine3": "", "Landmark": "",
    "CityID": "", "StateID": "", "District": "", "CountryID": "", "Pincode": "",
    "TelephoneNumber": "", "MobileNumber": "", "FaxNumber": "", "Email": "", "IncomeSlabID": ""
  },
  "MotherDetails":        { "FirstName": "", "MiddleName": "", "LastName": "" },
  "MaidenDetails":        { "Prefix": "", "FirstName": "", "MiddleName": "", "LastName": "" },
  "FatherHusbandDetails": { "Prefix": "", "FirstName": "", "MiddleName": "", "LastName": "" }
}
```

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/SetFamilyDetails
```

Response: `ClsValidateResponse` / `errorresponse`.

### Controller response (200)

```json
{ "message": "Success", "Description": "" }
```

A null body returns 400 `"Invalid data."`.

---

## 2. GetFamilyDetails

`POST /Onboarding/OtherDetails/GetFamilyDetails` with a raw JSON string body, for example `"100045"`.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/AccountStaging/GetFamilyDetails
{ "FormEntryID": "100045" }
```

Response (`SpouseAndFamilyResponse`). The data is **flattened**:

```json
{
  "Status": "Success",
  "Data": [{
    "HolderType": "1",
    "SpouseName": "", "SpouseOccupationID": "", "SpouseEmployerName": "", "SpouseOtherName": "",
    "SpouseAddressLine1": "", "SpouseAddressLine2": "", "SpouseAddressLine3": "", "SpouseLandmark": "",
    "SpouseCountryID": "", "SpouseStateID": "", "SpouseCityID": "", "SpouseDistrict": "", "SpousePincode": "",
    "SpouseTelephoneNumber": "", "SpouseMobileNumber": "", "SpouseFaxNumber": "", "SpouseEmail": "",
    "SpouseIncomeSlabID": "", "SpouseAnnualTurnover": "", "SpouseNationality": "", "SpouseOccupationWebsite": "",
    "PrefixMother": "", "MotherFirstName": "", "MotherMiddleName": "", "MotherLastName": "",
    "PrefixFatherHusband": "", "FatherHusbandFirstName": "", "FatherHusbandMiddleName": "", "FatherHusbandLastName": "",
    "PrefixMaiden": "", "MaidenFirstName": "", "MaidenMiddleName": "", "MaidenLastName": "",
    "CreatedModifiedBy": "", "CreatedModifiedOn": ""
  }],
  "Description": ""
}
```

### Controller response

| Case | HTTP | Body |
|---|---|---|
| OK | 200 | `{ "message": "Data fetched successfully", "data": <SpouseAndFamilyResponse> }` |
| Empty id | 400 | `"FormEntryID is required."` |
| 401 | 401 | – |
| Other | downstream code | `"Error fetching misc details"` |
| Exception | 500 | `"Internal server error"` |

---

## 3. getIncomeforfamilySlab

`POST /Onboarding/OtherDetails/getIncomeforfamilySlab` (query params ignored).

Downstream: `v2/Master/GetMaster` with masterCode **13**.

Response: `[ { "income_slab_id": "1", "income_slab": "Below 1 Lac" } ]`

Errors follow the README master pattern.
