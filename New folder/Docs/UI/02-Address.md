# Stage 2 – Address (`address`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/address?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.address` (shown when `stageId == 2`, or objection flow `stepId == 2`) |
| View | `Views/nriaccountopening2/address.cshtml` |
| Scripts | `validations.js`, `addresspage2.js` |
| Layout | `onboardingloayout` |

## 1. Purpose

Captures the **primary account holder's** (holder type `TRD`) **Permanent** and **Correspondence** addresses. For an existing Sharekhan customer (same PAN) the address is pre-filled from the existing record.

Hidden server values (same pattern as every stage, see [00-Common-Layout.md](00-Common-Layout.md#stage-page-conventions)): `lblskrefno`, `lblformno`, `txtformNo`, `lblemployeeid`, `lblbranchid`, `remarks`, `objections`, `objectionCount`, `stepId`, `stepName`.

## 2. Page structure – 2-step wizard

| Step | Title |
|---|---|
| 1 | Permanent Address |
| 2 | Correspondence Address |

Buttons: **← Previous** (`prevBtn`), **Next →** (`nextBtn`), **Save** (`saveBtn`, step 2 only). Progress bar `#progressBar`.

## 3. Field inventory (20 fields)

### Step 1 – Permanent Address (9)

| # | Label | Id | Control | Req | Validation / behaviour | Payload (`PermanentAddress.`) |
|---|---|---|---|---|---|---|
| 1 | Address 1 | `txtAddress1` | text max 50 | ✔ | 3–50 chars, not only digits; allowed chars `a-z A-Z 0-9 space - / , .`, no two consecutive special chars, double spaces collapsed, paste sanitised | `AddressLineOne` |
| 2 | Address 2 | `txtAddress2` | text max 50 | – | same sanitising | `AddressLineTwo` |
| 3 | Address 3 | `txtAddress3` | text max 50 | – | same | `AddressLineThree` |
| 4 | Landmark | `txtLandmark` | text max 40 | – | same char rules | `Landmark` |
| 5 | Country | `ddlCountry` | select (country master) | ✔ | Change → loads states; country ≠ `2` (India) → Pincode forced to `111111` read-only | `CountryID` |
| 6 | State | `ddlState` | select (state master by country) | ✔ | Change → loads cities | `StateID` |
| 7 | City | `ddlCity` | select (city master by state) | ✔ | | `CityID` |
| 8 | Pincode | `txtPincode` | text max 6, digits | ✔ | `^[1-9][0-9]{5}$` | `Pincode` |
| 9 | District | `txtdistrict` | text max 40 | – | letters/space only | `District` |

`AddressLineFour` is always `""`.

### Step 2 – Correspondence Address (10)

| # | Label | Id | Req | Payload (`CorrespondenceAddress.`) |
|---|---|---|---|---|
| 10 | Same as Primary Address | `chkaddresssameasabove` (checkbox) | – | `IsSameAddress` = Y/N |
| 11 | Address 1 | `txtcorrAddress1` | ✔ | `AddressLineOne` |
| 12 | Address 2 | `txtcorrAddress2` | – | `AddressLineTwo` |
| 13 | Address 3 | `txtcorrAddress3` | – | `AddressLineThree` |
| 14 | Landmark | `txtcorrLandmark` | – | `Landmark` |
| 15 | Country | `ddlcorrCountry` | ✔ | `CountryID` |
| 16 | State | `ddlcorrState` | ✔ | `StateID` |
| 17 | City | `ddlcorrCity` | ✔ | `CityID` |
| 18 | Pincode | `txtcorrPincode` | ✔ (6 digits) | `Pincode` |
| 19 | District | `txtcorrholderdistrict` | – | `District` |

Same validation rules as step 1.

## 4. Field connections

| Trigger | Effect |
|---|---|
| Country change | State list reloaded (`getStatemaster`), city list must be re-picked; non-India → pincode `111111` and read-only, India → pincode cleared and editable |
| State change | City list reloaded |
| "Same as Primary" ticked | Copies all permanent fields into correspondence, chains state → city loading for the correspondence drop-downs |
| "Same as Primary" unticked | Clears correspondence fields |
| Typing in any correspondence field | Automatically unticks "Same as Primary" |
| Page load (new entry) | `GetInProcessData(formNo)` → gets `Pan_No` → `GetExistingCustomerDetailsforaddress(pan)` → pre-fills both addresses if the PAN is an existing customer, ticks "Same" when identical |
| Page load (objection mode) | `getAddressonformid(skrefno)` → pre-fills saved `TRD` address, chained country→state→city with `setTimeout(200ms)` + `setDropdownValue` polling; shows objection banner |

## 5. API calls

| When | Endpoint | Request | Response used |
|---|---|---|---|
| Load | `NRIAccountOpening/getCountrymaster` (×2, one per drop-down) | JSON master request (ignored) | `country_id`, `country_name` |
| Country change | `NRIAccountOpening/getStatemaster` | `{masterCode:"7", parameter1: countryId}` | `state_id`, `state_name` |
| State change | `NRIAccountOpening/getCitymaster` | `{masterCode:"8", parameter1: stateId}` | `city_id`, `city_name` |
| Load (new) | `NRIAccountOpening/GetInProcessData` | `{formNumber}` | `Pan_No`, `Nri_Category` |
| Load (new) | `NRIAccountOpening/GetExistingCustomerDetailsforaddress` | `{panNo, searchText:"ADDRESS"}` | `AddressDetails[]` (TRD) |
| Load (objection) | `NRIAccountOpening/getAddressonformid` | JSON string `"<skrefno>"` | `data.AddressDetails[]` |
| Save | `NRIAccountOpening/SaveAddress` | `AddressRequest` JSON | `message` (`"Success"`), `Description` |

## 6. Save payload

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "AddressDetails": [{
    "HolderType": "TRD",
    "IsSameAddress": "Y",
    "PermanentAddress":      { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "District": "", "CountryID": "", "Pincode": "" },
    "CorrespondenceAddress": { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "District": "", "CountryID": "", "Pincode": "" }
  }]
}
```

Before sending, `validateAddressData` re-checks: permanent & correspondence line 1, country/state/city ≠ `0`, pincode present and valid.

**After save** – `message == "Success"` → "Address Saved Successfully" → redirect to `forminward` (or `objectionforminward` in objection mode). Otherwise error popup with `Description`.

## 7. Known issues

1. Step-2 `customValidation` does not return `{valid:true}` on success → returns `undefined`, so `customResult.valid` throws/blocks only if reached via **Next** (step 2 is last, so it is effectively unused).
2. Error messages say "3-70 characters" but the limit is 50.
3. Handlers on `#ddlCity,#ddlState` (permanent) reset the **correspondence** pincode – copy-paste bug.
4. `#btnresetaddressfileds`, `#uploadaddressfile`, `#uploadcorraddressfile` referenced in JS do not exist in the view.
5. Existing-customer prefill uses `$('#ddlCountry').val(...)` before options may have loaded.

## 8. React migration notes

* One reusable `<AddressForm value onChange />` component used twice, plus a "same as permanent" toggle that **derives** the correspondence value instead of copying.
* `useCountries()`, `useStates(countryId)`, `useCities(stateId)` hooks – cascading selects become trivial and remove the timeout/polling logic.
* Rule "non-India ⇒ pincode 111111 read-only" as a derived value.
