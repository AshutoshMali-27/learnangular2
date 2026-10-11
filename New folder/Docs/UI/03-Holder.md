# Stage 3 – Joint Holders (`holder`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/holder?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.holder` |
| View | `Views/nriaccountopening2/holder.cshtml` |
| Scripts | `validations.js`, `holderpage2.js` |
| Server APIs | [holderController.md](../API/holderController.md) |

## 1. Purpose

Lets the branch user add up to **two joint holders** (2nd and 3rd holder) for the account, each with PAN-verified identity, personal details, verified contact details and permanent + correspondence address. The holders are kept **in browser memory** (`holderList`) and shown as cards. Clicking **Save holder details** posts all of them in one call. If the account has no joint holders, the user clicks **Skip Holder**.

## 2. Screen layout

```
┌ Header: "Holder Details"                         [+ Add Holder] ┐
│ Objection banner (objection mode only)                          │
│ #Divvalidateholder  ← 5-step holder entry wizard (hidden until Add/Edit)
│ #holderGridWrapper  ← cards of added holders (name, PAN, type badge, email, mobile, "Edit Details")
│                                   [Save holder details] [Skip Holder] │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Initial state |
|---|---|
| `#Divvalidateholder` (wizard) | hidden |
| `#holderGridWrapper` (cards) | hidden (`d-none`) |
| `#btnsaveholderdetails` | hidden – shown once ≥1 holder is in the grid |
| `#btnSkipholder` | visible while no holders exist |
| `#btnaddholder` | enabled while fewer than 2 holders |

Each wizard step has a ✕ close button (`.btnclose`) that discards the in-progress holder and goes back to the grid.

## 3. Holder entry wizard – 5 steps

Buttons: **← Previous** (`prevBtn`), **Next →** (`nextBtn`), **Save** (`saveBtn`, last step only – adds or updates the holder **in memory**, it does not call the server).

### Step 1 – Identity Verification (11 controls)

| # | Label | Id | Control | Req | Behaviour | Payload (`HolderDetails[]`) |
|---|---|---|---|---|---|---|
| 1 | Holder Type | `ddlholder` | select: `2ND` / `3RD` | ✔ | **Auto-set and disabled**: no holders yet → `2ND`, otherwise `3RD` | `HolderType` |
| 2 | PAN | `txtholderpan` | text max 10 | ✔ | Alnum only, upper-cased, paste sanitised; individual-PAN regex; **duplicate check** against other holders in memory | `PAN` |
| 3 | Validate | `btnvalidateholderpan` | button | must succeed | Blocks the primary applicant's PAN ("PAN number already exists in the system for this client"), then calls `holder/CheckPanNoforholder` | – |
| 4 | Reset | `btnresetholderpan` | button | – | Clears the **whole holder form** and all validation flags | – |
| 5 | Date of Birth | `txtholderdob` | read-only | ✔ | From PAN response | `DateOfBirth` |
| 6 | NSDL name | `lblholderpan` in `#holderpaninfo` | label | – | Shown after validation | – |
| 7 | Prefix | `ddlholderprefix` | Mr./Mrs./Miss/Ms./Dr. | ✔ | Drives gender / marital / relation defaults (same rules as Inward) | `NamePrefix` |
| 8–10 | First / Middle / Last Name | `txtholderFirstName`, `txtholderMiddleName`, `txtholderLastName` | text max 50, letters only | First ✔ | Auto-split from NSDL name | `FirstName`, `MiddleName`, `LastName` |

### Step 2 – Personal Details (≈25 controls)

| # | Label | Id / name | Options | Req | Payload |
|---|---|---|---|---|---|
| 11 | Residential Status | radio `resistatusholder` (`chkresindi`, `chknonresnidi`, `chkfognnatn`, `chkiniorg`) | `RI`, `NRI`, `FI`, `PIO` | ✔ | `ResidentialStatusSubtype` |
| 12 | Gender | radio `holdergender` | `M`, `F`, `O` | ✔ | `Gender` |
| 13 | Marital Status | radio `holdermaritalstatus` | `M`, `U`, `W` | ✔ | `MaritialStatus` |
| 14 | Relation | radio `holderfhstatus` (`chkholderH` Spouse, `chkholderF` Father) | `H`, `F` | ✔ | `FatherHusbandFlag` |
| 15 | Father/Spouse Prefix | `ddlholderfhnameprefix` | Mr./Mrs./… | ✔ | `PrefixFatherHusbandName` |
| 16–18 | Father/Spouse First / Middle / Last | `txtholderfhFirstName`, `…MiddleName`, `…LastName` | text max 50 | First ✔ (≥2 chars) | `FatherHusbandFirstName/Middle/Last`, and `FatherHusbandName` = all three joined |
| 19 | Mother Prefix | `ddlholdermothernameprefix` | **disabled** | – | not sent |
| 20–22 | Mother First / Middle / Last | `txtholdermotherFirstName`, `…MiddleName`, `…LastName` | text | – | `MotherFirstName/Middle/Last` |
| 23 | Maiden Prefix | `ddlholdermaidennameprefix` | Mr./… | – | `PrefixMaidenName` |
| 24–26 | Maiden First / Middle / Last | `txtholdermaidenFirstName`, `…MiddleName`, `…LastName` | text | – | `MaidenFirstName/Middle/Last` |

Changing **Relation** clears and re-enables the father/spouse name fields.

### Step 3 – Contact Details (9 controls)

| # | Label | Id | Req | Behaviour | Payload |
|---|---|---|---|---|---|
| 27 | Email ID | `txthodlermail` | ✔ | `Validation.validateEmail` + duplicate check vs other holders | `EmailID` |
| 28 | Email Relationship | `ddlholderemailrelation` | ✔ | Relation master filtered to id 0 (Self) | `EmailRelation` |
| 29 | Validate / Reset email | `btnvalidateholderemail`, `btnholderResetEmail` | must succeed | `holder/CheckEmailforholder` | – |
| 30 | Mobile No | `txtholdermobile` | ✔ | Digits only + duplicate check | `MobileNumber` |
| 31 | Mobile Relationship | `ddlholdermobilerelation` | ✔ | same master | `MobileRelation` |
| 32 | Validate / Reset mobile | `btnholdervalidatemobile`, `btnholderResetMobile` | must succeed | `holder/CheckMobileforholder` | – |
| 33 | Occupation Type | `ddlholderOccupationType` | – | **Hidden**; loaded from occupation master but value not used | `OccupationTypeID` = `"0"` (hard-coded) |

### Step 4 – Permanent Address (9) and Step 5 – Correspondence Address (10)

Same fields and rules as the [Address stage](02-Address.md), with ids `txtholderAddress1..3`, `txtholderLandmark`, `ddlholderCountry/State/City`, `txtholderPincode`, `txtholderdistrict` and correspondence `txtholdercorrAddress1..3`, `txtholdercorrLandmark`, `ddlholdercorrCountry/State/City`, `txtholdercorrPincode`, `txtcorrholderdistrict1`, plus **Same as Primary Address** `chkholderaddsameascorr`.

Differences from the Address stage: the address-line limit is **3–70** characters (but `maxlength="50"` in HTML). Non-India country forces pincode `111111` read-only.

**Total per holder:** ≈ 55 controls (≈ 45 data fields).

## 4. Step validation (`holderStepValidationRules`)

| Step | Required | Custom |
|---|---|---|
| 1 | Holder type, PAN, DOB, Prefix, First name | PAN validated |
| 2 | Gender, Residential status, Marital, Relation, F/S prefix, F/S first name | F/S first name ≥ 2 chars |
| 3 | Email, Mobile | both validated |
| 4 | Address 1, Country, State, City, Pincode | 3–70 chars, not only digits, valid pincode |
| 5 | Same for correspondence | Same |

The **Save** button on step 5 re-runs step-5 validation only.

## 5. Field / flow connections

| Trigger | Effect |
|---|---|
| Page load (new) | `GetInProcessData(formNo)` → stores the primary applicant's PAN (`panno`) so it can't be reused as a joint holder |
| Page load (objection) | `holder/getholderonformid(skrefno)` → fills `holderList`, renders cards, shows Save, hides Skip; objection banner + modal |
| Add Holder | Shows wizard, hides grid / Save / Skip; if 2 holders already → warning "Only two holder are allow to add" |
| Wizard Save | Builds `holdervalue` + `addressValue`; **add** → push to `holderList[0]`, append a card; **edit** (`editingIndex` set) → replace and re-render the card. Resets the wizard, shows grid + Save, disables Add when 2 holders |
| Edit Details (card) | Loads the holder into the wizard (country→state→city chained loads), marks PAN/email/mobile as already validated (locked), ticks "same address" if identical |
| ✕ Close | Discards wizard input, returns to grid |
| PAN validated | Fills DOB/name; `EXACT_MATCH`/`ERROR` screening → error + redirect to `forminward`; `SeedingStatus = R` → error, PAN cleared |
| Save holder details | `POST holder/SaveHolders` with `holderList[0]` (`IsHolderAvailable = "Y"`) |
| Skip Holder | `POST holder/SaveHolders` with empty lists and `IsHolderAvailable = "N"` |

## 6. API calls

| When | Endpoint | Request | Response used |
|---|---|---|---|
| Load | `holder/EmailRelationforholder` | JSON master request | relation list (filtered to id 0) |
| Load | `holder/mobrelationforholder` | same | same |
| Load | `holder/getCountrymasterforholder` ×2 | – | `country_id`, `country_name` |
| Load | `holder/getoccupationdetails` | – | `occupation_id`, `occupation_name` |
| Country change | `holder/getStatemasterforholder` | `{masterCode:"7", parameter1}` | states |
| State change | `holder/getCitymasterforholder` | `{masterCode:"8", parameter1}` | cities |
| Load (new) | `NRIAccountOpening/GetInProcessData` | `{formNumber}` | `Pan_No` |
| Load (objection) | `holder/getholderonformid` | JSON string skrefno | `data.HolderDetails[]`, `data.AddressDetails[]` |
| Validate PAN | `holder/CheckPanNoforholder` | form `panNo` | `IsValid`, `Dob`, `Name`, `SeedingStatus`, `ErrorResponse`, `matchstatus`, `Description` |
| Validate email | `holder/CheckEmailforholder` | form `email, pan, formNo, empid` | `isValid`, `description` |
| Validate mobile | `holder/CheckMobileforholder` | form `mobile, pan, formNo, empid` | `isValid`, `description` |
| Save / Skip | `Holder/SaveHolders` | `HolderDataModel` JSON | `holder.Message`, `holder.Description` |

## 7. Save payload (`HolderDataModel`)

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "IsHolderAvailable": "Y",
  "HolderDetails": [{
    "HolderType": "2ND", "NamePrefix": "Mr.", "FirstName": "", "MiddleName": "", "LastName": "",
    "PAN": "", "DateOfBirth": "", "SmsTrading": "Y", "ResidentialStatusSubtype": "NRI",
    "Gender": "M", "MaritialStatus": "U", "FatherHusbandFlag": "F", "FatherHusbandName": "first middle last",
    "PrefixFatherHusbandName": "Mr.", "FatherHusbandFirstName": "", "FatherHusbandMiddleName": "", "FatherHusbandLastName": "",
    "MotherFirstName": "", "MotherMiddleName": "", "MotherLastName": "",
    "PrefixMaidenName": "0", "MaidenFirstName": "", "MaidenMiddleName": "", "MaidenLastName": "",
    "EmailID": "", "EmailRelation": "0", "MobileNumber": "", "MobileRelation": "0",
    "OccupationTypeID": "0", "IncomeSlabID": "5", "PanLinkWithAadhaar": "<SeedingStatus>",
    "FormerAliasesName": "", "Citizenship": ""
  }],
  "AddressDetails": [{
    "HolderType": "2ND", "IsSameAddress": "N",
    "PermanentAddress": { "AddressLineOne": "", "AddressLineTwo": "", "AddressLineThree": "", "AddressLineFour": "", "Landmark": "", "CityID": "", "StateID": "", "District": "", "CountryID": "", "Pincode": "" },
    "CorrespondenceAddress": { "...": "same shape" }
  }]
}
```

Skip payload: same with `"IsHolderAvailable": "N"`, `HolderDetails: []`, `AddressDetails: []`.

**After save:** `holder.Message == "Success"` → "Holder Saved successfully" → `forminward` (or `objectionforminward` in objection mode). Skip always goes back to `forminward`.

## 8. Known issues

1. `OccupationTypeID` is hard-coded `"0"` and `IncomeSlabID` `"5"`, so the occupation drop-down is useless.
2. `validateHolderField` is defined twice; the second definition wins.
3. Step-1 check `firstName.length < 0` can never fail.
4. Card HTML is built with raw string interpolation (no escaping), which is an XSS risk with names.
5. `btnSkipholder` saves without confirmation.
6. Address-line validation (3–70) differs from the HTML `maxlength` (50) and from the Address stage (3–50).

## 9. React migration notes

* `holders: Holder[]` (max 2) in page state; `<HolderCard>` list + `<HolderWizard mode="add|edit" initial />` in a drawer/modal.
* Reuse `<PanVerifier>`, `<VerifiableField>`, `<AddressForm>` from Inward / Address.
* Holder type derived from list index (`index 0 → 2ND`, `1 → 3RD`) instead of a disabled select.
* Duplicate-PAN/email/mobile checks become a validation rule over `[primaryPan, ...holders]`.
