# Stage 8 – Family Details (`familydetails`) – currently disabled

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/familydetails?formNo=&skrefno=&...` |
| Controller action | `nriaccountopening2Controller.familydetails` (no stage check – always returns the view when logged in) |
| View | `Views/nriaccountopening2/familydetails.cshtml` ("Familydetails Stage") |
| Scripts | `validations.js`, `familydetailpage2.js` |
| Server APIs | [OtherDetailsController.md](../API/OtherDetailsController.md) |
| Status | **Not reachable from the journey**: step 8 is hidden in the stage tracker and stage 8 is skipped ([00-FormInward-StageTracker.md](00-FormInward-StageTracker.md)) |

> `wwwroot/pages/otherdetails.js` is an older, unreferenced version of this script.

## 1. Purpose

Captures spouse details (for married female applicants), plus mother's name, maiden name and father / husband name.

## 2. Steps

| Step | Title | Shown when |
|---|---|---|
| 1 | Spouse Details | `isSpouse = 1`: the primary holder (`HolderType[0]` from `GetInProcessData`) has `maritial_status = M` **and** `gender = F` |
| 2 | Family Details | always |

If not a spouse case, the page opens directly on step 2 with only **Save** visible (progress 100 %). Otherwise: step 1 → **Next** → step 2 → **Save**. Next does not validate. All validation happens on Save.

## 3. Fields

### Step 1 – Spouse Details (18)

| Label | Id | Control | Req (if spouse) | Payload `SpouseDetails.` |
|---|---|---|---|---|
| Spouse Name | `txtspousename` | text max 50, letters | ✔ | `Name` |
| Occupation | `ddlspouseoccupation` | select (occupation master) | ✔ | `OccupationID` |
| Employer Name | `txtspouseemployername` | text max 50 | ✔ | `EmployerName` |
| Same as Permanent Address | `chkspouseaddress` | checkbox | – | copies from `#txtAddress1…` (ids that don't exist on this page) |
| Address 1 / 2 / 3 | `txtspouseAddress1..3` | textarea max 80 (3–70 chars rule) | Address 1 ✔ | `AddressLine1..3` |
| Landmark | `txtspouseLandmark` | letters/space | – | `Landmark` |
| District | `txtspousedistrict` | letters/space | – | `District` |
| Country / State / City | `ddlspouseCountry` / `ddlspouseState` / `ddlspouseCity` | cascading selects | ✔ | `CountryID`, `StateID`, `CityID` |
| Pincode | `txtspousePincode` | max 6 digits | ✔ | `Pincode` |
| Mobile | `txtspousemobileno` | `^[6-9]\d{9}$` | ✔ | `MobileNumber` |
| Email | `txtspouseemailid` | email (blocked domains) | ✔ | `Email` |
| Income Slab | `ddlspouseincomeslab` | select (income master) | – | `IncomeSlabID` |
| Tel No | `txtspousetelno` | digits | – | `TelephoneNumber` |
| Fax No | `txtspousenofaxno` | digits 6–15 | – | `FaxNumber` |

### Step 2 – Family Details (11)

| Group | Ids | Req | Payload |
|---|---|---|---|
| Mother's name | `txtmotherfname`, `txtmothermname`, `txtmotherlname` | first + last ✔ | `MotherDetails.FirstName/MiddleName/LastName` |
| Maiden name | `ddlmaidenprefix`, `txtmaidenfname`, `txtmaidenmname`, `txtmaidenlname` | prefix*, first + last ✔ | `MaidenDetails.Prefix/FirstName/MiddleName/LastName` |
| Father / Husband name | `ddlfhprefix`, `txtfhfname`, `txtfhmname`, `txtfhlname` | prefix*, first + last ✔ | `FatherHusbandDetails.Prefix/...` |

\* The prefix check compares with `"0"`, but the empty option value is `""`, so an unselected prefix passes.

## 4. API calls

| When | Endpoint |
|---|---|
| Load | `NRIAccountOpening/getCountrymaster`, `OtherDetails/getIncomeforfamilySlab`, `holder/getoccupationdetails`, `NRIAccountOpening/GetInProcessData` |
| Cascades | `NRIAccountOpening/getStatemaster`, `getCitymaster` |
| Save | `OtherDetails/SaveFamilyDetails` (`FamilyDetailsRequest`, see API doc) → `forminward` |

## 5. Known issues

* No pre-fill (`GetFamilyDetails` is never called) and no objection mode.
* "Same as permanent address" reads elements that are not on this page.
* Select validations compare with `"0"` while the placeholders use `""`.

## 6. React migration notes

If the stage is re-enabled: a two-section form with `showSpouse = primaryHolder.gender === 'F' && primaryHolder.maritalStatus === 'M'`. Reuse `<AddressForm>`, and pre-fill from `GetFamilyDetails`.
