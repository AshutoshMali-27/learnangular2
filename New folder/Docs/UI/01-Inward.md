# Stage 1 – Form Inward (`inward`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/inward?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.inward` (see [API doc](../API/nriaccountopening2Controller.md)) |
| View | `Views/nriaccountopening2/inward.cshtml` |
| Scripts | `wwwroot/pages/validations.js`, `wwwroot/pages/inward2.js` (+ select2) |
| CSS | `css/onboarding.css`, `css/commonjourney.css`, `css/inward.css` |
| Layout | `onboardingloayout` (see [00-Common-Layout.md](00-Common-Layout.md)) |

## 1. Purpose

Inward is the **first stage** of the NRI account-opening journey. The branch user captures the client's PAN-verified identity, personal details, product / NRI-account selection, DP (depository) details, verified contact details and branch / sales mapping. Saving this stage creates the application in the backend and returns the **SK Reference Number** (`skReferenceNo` = `FormEntryID`). Every later stage uses this number.

The page works in two modes:

| Mode | Trigger | Behaviour |
|---|---|---|
| **New entry** | `objectionCount` empty/0 | Blank form; user enters and validates everything |
| **Objection correction** | `objectionCount > 0` (coming from Data Objection screen) | Form is pre-filled from the backend, the objection banner is shown, PAN/email/mobile are locked as already validated |

## 2. Server values rendered into the page (hidden)

| Element id | Source | Used for |
|---|---|---|
| `lblformno`, `txtformNo` (`<p>`) | `ViewBag.formNo` | Form number in the header and save payload (`formNo`) |
| `lblskrefno` | `ViewBag.skrefno` | SK reference no – used to load data in objection mode |
| `lblemployeeid` | `ViewBag.empId` (session) | `entryBy`, `updateBy`, `empid` for email/mobile check |
| `lblbranchid` | `ViewBag.branchid` (session) | `branchCode` in payload, `barnchcode` for code validations |
| `remarks`, `objections`, `objectionCount`, `stepId`, `stepName` (hidden inputs) | query string | Objection mode |
| `chkbsda` value | `ViewBag.BsdaValue` (`CheckboxSettings:BsdaValue` = 40) | Billing scheme id when BSDA is ticked |
| Branch Code display | `ViewBag.branchTypeCode` | Read-only display |
| `__RequestVerificationToken` | `@Html.AntiForgeryToken()` | Sent as `RequestVerificationToken` header on every AJAX call |

## 3. Page structure – 6-step wizard

The page is a single form split into 6 `<div class="step" data-step="N">` panels with a progress bar (`#progressBar`, width = step/6 × 100 %).

| Step | Title | Contents |
|---|---|---|
| 1 | PAN & Identity Details | PAN, DOB, NSDL name, prefix, first/middle/last name |
| 2 | Personal Details | NRI with, residential status, gender, marital status, father/spouse |
| 3 | Product Details | Residential status (fixed NRI), NRI type, products, POA, account type, contract note, account with |
| 4 | DP Details | Link with existing DP, NRE DP block, NRO DP block, BSDA |
| 5 | Contact Details | Email + relation, mobile + relation, telephone |
| 6 | Branch Details | Branch code, serving branch, preferred branch, admin, lead id, sales executive, remisier, referring employee, HNI |

Footer buttons (`#stepperActions`): **← Previous** (`#prevBtn`, hidden on step 1), **Next →** (`#nextBtn`, hidden on step 6), **Save** (`#saveBtn`, only on step 6).

## 4. Field inventory

Legend: **Req** = required to pass step validation / save; **Payload** = key in the `FormInward` JSON sent on save.

### Step 1 – PAN & Identity Details (8 controls)

| # | Label | Id | Control | Req | Behaviour | Payload |
|---|---|---|---|---|---|---|
| 1 | PAN Number | `txtPanNo` | text, maxlength 10, upper-case | ✔ | Keypress allows only `A-Z0-9`, max 10. On input, `Validation.validatePAN` (regex `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` – 4th char must be **P**, i.e. individual PAN) toggles `is-valid/is-invalid` and enables **Validate** | `panNo` |
| 2 | Validate | `btnValidatePan` | button | must be clicked (`isvalidpan=1`) | Calls `CheckPanNo` – see §6.1 | – |
| 3 | Reset | `btnResetPAN` | button | – | Clears PAN, DOB, NSDL info, resets **all** validation flags (PAN/email/mobile/lead/SEC/remisier/REC), re-enables email/mobile, resets NRI = checked & Individual = checked | – |
| 4 | Date of Birth | `txtDOB` | text, read-only | ✔ | Filled from PAN response (`dd/MM/yyyy`). Age < 18 → error and redirect | `dob` |
| 5 | NSDL Name | `lblnameasperpan` (in `#divpaninfo`) | label | – | Shown after successful PAN validation | `nameAsPerPan` |
| 6 | Prefix | `ddlinwardprefix` | select: Mr. / Mrs. / Miss / Ms. / Dr. | ✔ | Drives defaults in step 2 (§5) | `prefix` |
| 7 | First Name | `txtFirstName` | text, max 30 | ✔ | Auto-filled by splitting NSDL name; letters and single spaces only | `Fname` |
| 8 | Middle Name | `txtMiddleName` | text, max 30 | – | Auto-filled (middle words) | `Mname` |
| 9 | Last Name | `txtLastName` | text, max 30 | – | Auto-filled (last word) | `Lname` |

Name split rule (JS): 1 word → first; 2 → first + last; 3 → first, middle, last; ≥4 → first, (all middle words), last.

### Step 2 – Personal Details (5 groups, 16 controls)

| # | Label | name / ids | Options (value) | Req | Payload |
|---|---|---|---|---|---|
| 10 | NRI With | radio `nriwith`: `chkindianpassport`, `ckhforeignpassport`, `chkmariner` | Indian Passport (`I`), Foreign Passport (`F`), Mariner (`M`) | ✔ | `nriCategory` |
| 11 | Residential Status | radio `resistatus`: `chkresindi`, `chknonresnidi`, `chkfognnatn`, `chkiniorg` | Resident Individual (`RI`, disabled unless Mariner), NRI (`NRI`), Foreign National (`FI`), Person of Indian Origin (`PIO`) | ✔ | `residentalStatus` |
| 12 | Gender | radio `gender`: `chkmale`, `chkfemale`, `chkother` | `M`, `F`, `O` | ✔ | `gender` |
| 13 | Marital Status | radio `mstatus`: `chkmarried`, `chkunmarried`, `ckhwidow` | `M`, `U`, `W` | ✔ | `maritalStatus` |
| 14 | Father / Spouse | radio `dependendstatus`: `chkhusband`, `chkfather` | Spouse (`H`), Father (`F`) | ✔ | `isFatherOrHusband` |
| 15 | Father/Spouse First Name | `txtfhname` | text max 30, letters only | ✔ | `fatherHusbandFname` |
| 16 | Father/Spouse Middle Name | `txtfhnamemiddlename` | text max 30 | – | `fatherHusbandMname` |
| 17 | Father/Spouse Last Name | `txtfhnamelastname` | text max 30 | – | `fatherHusbandLname` |

`fatherHusbandName` = first + middle + last joined with single spaces.

> Markup bug: the Widow radio has id `ckhwidow` but its label has `for="chkwidow"`, so clicking the label does not select it.

### Step 3 – Product Details (≈17 controls)

| # | Label | name / ids | Options | Req | Behaviour | Payload |
|---|---|---|---|---|---|---|
| 18 | Residential Status | radio `residentailstatus`: `chkindian`, `chknri` (checked), `chkforeignnation` (hidden) | all **disabled**, NRI fixed | – | Display only, **not sent** | – |
| 19 | NRI Type | checkbox `nritypes`: `chknrepis`, `chknrenonpis`, `chknropis`, `chknrononpis` | NRE PIS, NRE NONPIS, NRO PIS, NRO NONPIS (multi-select) | ✔ ≥1 | Drives products (§5) and DP blocks | `nrePis`, `nreNonPis`, `nroPis`, `nroNonPis` (Y/N) |
| 20 | Product | checkbox `product`: `chkEqn`, `chkMF`, `chkipo`, `chkcurrency`, `chkcommodity`, `chkfno` | Equity, MF, IPO, Currency, Commodity, FNO | ✔ ≥1 | **All disabled** – auto-ticked from NRI type (FNO enabled only for NRO NONPIS) | `eqFlag`, `mfFlag`, `currFlag`, `comFlag`, `fnoFlag` (IPO not sent) |
| 21 | POA | checkbox `chkpoa` | – | – | Block hidden (`d-none`) | `poa` (Y/N) |
| 22 | Account Type | radio `accountType`: `ckhindividual` (checked), `chknonindividual` (disabled) | `I`, `N` | ✔ | Only Individual possible | `accountType` |
| 23 | Contract Note | radio `contractnote`: `chkphysical`, `chkdigital`, `chkNA` | `PHY`, `DIG`, `NA` | ✔ | | `contractNote` |
| 24 | Account With | radio `accountwith`: `chknsdl` (checked), `chkcdsl` (disabled) | `NSDL`, `CDSL` | ✔ | Decides default DP id | `accountWith` |

### Step 4 – DP Details (≈10 controls)

| # | Label | Id | Control | Req | Behaviour | Payload |
|---|---|---|---|---|---|---|
| 25 | Link With Existing DP | radio `islinkwithdp`: `chkyes` (`Y`), `chkno` (`N`, default) | radio | ✔ | §5 DP rules | `isExistingDp` |
| 26 | NRE DP Name | `ddlselectnredp` | select (DP master) | if Yes + NRE | Hidden when No (shows fixed label "SHAREKHAN LIMTED"). Change → copies value to `txtnredpid` | `dpNreName` |
| 27 | NRE DP ID | `txtnredpid` | text read-only | if NRE | No → auto `IN300513` (NSDL) / `12036000` (CDSL) | `NreDPId` |
| 28 | NRE Client ID | `txtnreclientid` | text max 8, digits | if Yes + NRE (exactly 8 digits) | | `NreBeneficiaryId` |
| 29 | NRO DP Name | `ddlselectnrodp` | select | if Yes + NRO | same as NRE | `dpNroName` |
| 30 | NRO DP ID | `txtnrodpid` | text | if NRO | same as NRE | `NroDPId` |
| 31 | NRO Client ID | `txtnroclientid` | text max 8, digits | if Yes + NRO (8 digits) | | `NroBeneficiaryId` |
| 32 | BSDA | checkbox `chkbsda` (name `bsda`) | value = `ViewBag.BsdaValue` | – | Block hidden. Unticked → `"5"` | `billSchId` |

Section labels `lbldpnredetails` / `lbldpnrodetails` switch between "NRE/NRO DP Details" and "NRE/NRO Exist DP Details".

### Step 5 – Contact Details (10 controls)

| # | Label | Id | Control | Req | Behaviour | Payload |
|---|---|---|---|---|---|---|
| 33 | Email ID | `txtemail` | email, max 120 | ✔ | On blur `Validation.validateEmail` (blocks `sharekhan.com`, `miraeassetcm.com`) → enables Validate | `emailId` |
| 34 | Email Relationship | `ddlemailrelation` | select | ✔ | Loaded from relation master, **filtered to `relationship_id == 0` (Self)** | `emailRel` |
| 35 | Validate Email | `btnvalidateemail` | button | must succeed | `CheckEmail` (also sends verification mail) | – |
| 36 | Reset | `btnResetEmail` | button | – | Unlocks email + relation | – |
| 37 | Mobile No. | `txtmobile` | text max 15, digits | ✔ | On blur non-empty → enables Validate | `mobileNo` |
| 38 | Mobile Relationship | `ddlmobilerelation` | select | ✔ | Same master + filter as email | `mobileRel` |
| 39 | Validate Mobile | `btnvalidatemobile` | button | must succeed | `CheckMobile` | – |
| 40 | Reset | `btnResetMobile` | button | – | | – |
| 41 | ISD Code | `txtisdcode` | text max 5 (JS caps at 4 digits) | – | | `telephoneNoISD` |
| 42 | Telephone No. | `txttelephoneno` | text max 15, digits | – | | `telephoneNo` |

### Step 6 – Branch Details (≈16 controls)

All of these are **disabled until PAN, Email and Mobile are validated** (`toggleFieldBasedOnValidation`).

| # | Label | Id | Control | Req | Behaviour | Payload |
|---|---|---|---|---|---|---|
| 43 | Branch Code | (display) | text | – | `ViewBag.branchTypeCode` | `branchCode` ← `lblbranchid` (session branch **id**) |
| 44 | Serving Branch Code | `txtServiceBranch` + `ul#serviceBranchList` | autocomplete (hidden block) | – | Typing calls serving-branch master, picking sets `data-branch-id` | `servingBranchCode` |
| 45 | Preferred Branch Code | `txtPreferredBranch` | select2 (searchable, clearable) | – | Options = serving-branch master | `preferredBranchCode` |
| 46 | Admin Name | `ddladmin` | select | ✔ (≠ "0") | Admin master | `adminName` |
| 47 | Lead ID | `txtleadid` | text, digits, max 10 | – (if filled must be validated) | Enables Validate | `leadId` |
| 48 | Validate / Reset | `btnvalidateleadid`, `btnresetleadid` | buttons | | `validatelead` | – |
| 49 | Sales Executive Code | `txtsalesexeccode` | text, alnum, max 10 | ✔ + validated | | `salesExcode` |
| 50 | Validate / Reset | `btnvalidateSEC`, `btnresetSEC` | buttons | | `validatesaleexecativecode` | – |
| 51 | Remisier Code | `txtremisiercode` | text, alnum max 10 (block hidden) | – | | `remiserCode` |
| 52 | Validate / Reset | `btnvalidateremisier`, `btnresetremisier` | | | `validateremisercode` | – |
| 53 | Referring Employee Code | `txtreferempcode` (block hidden) | text alnum max 10 | – | | `referingEmployeeCode` |
| 54 | Validate / Reset | `btnvalidaterec`, `btnresetrec` | | | `validatereccode` | – |
| 55 | HNI | `checkHNI` | checkbox | – | | `hniFlag` (Y/N) |

**Total:** ~55 interactive controls (≈38 data fields + validate/reset buttons). Hidden (`d-none`) and currently unused in the UI: Foreign-National residential option (step 3), POA, BSDA, Serving Branch, Remisier, Referring Employee.

## 5. How the fields are connected (business rules)

| Trigger | Effect |
|---|---|
| PAN valid format | Enables **Validate PAN** |
| PAN validated OK | Fills DOB, NSDL name, splits name into First/Middle/Last; locks PAN & DOB; stores `SeedingStatus` → `panlink_aadhar`; calls **GetExistingCustomerDetails** to pre-fill contact data |
| Age from DOB < 18 | Error "Account opening is not permitted for users below 18 years" → redirect to `forminward` |
| `matchstatus` = `EXACT_MATCH` or `ERROR` (negative-list screening) | Error "Account get exact match or error" → redirect to `forminward` |
| `SeedingStatus = "R"` (PAN–Aadhaar not linked) | Error popup with name + ITD error → PAN fields cleared for re-entry |
| Prefix = Mr. | Gender = Male, Father/Spouse = Father |
| Prefix = Mrs. | Gender = Female, Marital = Married, Father/Spouse = Spouse |
| Prefix = Miss | Gender = Female |
| Any prefix change | Clears gender / marital / father-spouse first |
| Gender = Male | Father/Spouse = Father |
| NRI With = Mariner | Enables "Resident Individual"; any other choice disables and unticks it |
| NRI Type change | `updateProductCheckboxes`: NRE PIS or NRO PIS → **Equity**; NRE NONPIS or NRO NONPIS → **MF**; NRO NONPIS → **FNO** ticked and user-editable. Also `handleDPFields`: enables/clears NRE and NRO DP inputs depending on which side is selected; when not linking to existing DP fills DP ID (`IN300513` NSDL / `12036000` CDSL) |
| Link Existing DP = No | DP name drop-downs hidden, fixed "SHAREKHAN LIMTED" label, DP ID read-only auto-filled, client-id blocks hidden |
| Link Existing DP = Yes | DP name drop-downs shown, DP ID editable, client ID required (8 digits) |
| DP name selected | DP ID = selected `dp_number` |
| Existing customer found (PAN) | Info popup; pre-fills email + relation, mobile + relation (Validate buttons enabled); NRI types already held are **disabled** so the user cannot open the same type again |
| PAN + Email + Mobile all validated | Unlocks step-6 branch fields |
| Validate code fails | Field locked, button red; must click Reset to retry |

## 6. API calls made by the page

All POSTs include header `RequestVerificationToken`. Details of request/response are in [NRIAccountOpeningController.md](../API/NRIAccountOpeningController.md).

| When | Endpoint | Request | Used response fields |
|---|---|---|---|
| Page load | `NRIAccountOpening/getEmailRelation` | JSON `{masterCode:"1",...}` (ignored by server) | `relationship_id`, `relationshipname` (filtered to id 0) → `ddlemailrelation` |
| Page load | `NRIAccountOpening/getmobileRelation` | same | → `ddlmobilerelation` |
| Page load | `NRIAccountOpening/getadmindetails` | JSON `{masterCode:"52"}` (server uses 3) | `admin_id` (value), `admin_id1` (text) → `ddladmin` |
| Page load | `NRIAccountOpening/getDPmaster` | JSON | `dp_number`, `dp_name` → both DP drop-downs (**populated after a 5-second `setTimeout`**) |
| Page load | `NRIAccountOpening/getservingbranchcode` | JSON | `branch_id`, `branch_name` → `txtPreferredBranch` |
| Typing in serving branch | `NRIAccountOpening/getservingbranchcode` | JSON `{masterCode:"2", parameter1:<text>}` | suggestion list |
| 6.1 Validate PAN | `NRIAccountOpening/CheckPanNo` | form `panNo` | `IsValid`, `Dob`, `Name`, `SeedingStatus`, `ErrorResponse`, `matchstatus`, `Description` |
| After PAN OK | `NRIAccountOpening/GetExistingCustomerDetails` | JSON `{panNo, searchText:"EMLMOB"}` | `EMAIL_ID`, `EMAIL_DECLR_RELATION`, `MOBILE_NO`, `MOBILE_DECLR_RELATION`, `NRI_TYPE` |
| Validate Email | `NRIAccountOpening/CheckEmail` | form `email, pan, formNo, empid` | `isValid`, `description` |
| Validate Mobile | `NRIAccountOpening/CheckMobile` | form `mobile, pan, formNo, empid` | `isValid`, `description` |
| Validate Lead | `NRIAccountOpening/validatelead` | form `leadid, barnchcode` | `isValid` |
| Validate Sales Exec | `NRIAccountOpening/validatesaleexecativecode` | form `salescode, barnchcode` | `isValid`, `Description` |
| Validate Remisier | `NRIAccountOpening/validateremisercode` | form `remisercode, barnchcode` | `isValid`, `Description` |
| Validate Ref. Emp | `NRIAccountOpening/validatereccode` | form `reccode, barnchcode` | `isValid`, `Description` |
| Objection mode load | `NRIAccountOpening/GetFormDetails` | JSON string `"<skrefno>"` | `data[0]` (`FormInward`) |
| Save | `NRIAccountOpening/SaveFormDetails` | `multipart/form-data`, field `model` = JSON `FormInward` | `skReferenceNo`, `Description` |

## 7. Wizard navigation & validation

* **Next** runs `validateStep(currentStep)` using the `stepValidationRules` table below; on failure shows a "Validation Error" SweetAlert. Before steps 5 and 6 it waits (`ensureDropdownsLoaded`, max 5 s) for the relation/admin/DP drop-downs to be populated.
* **Previous** just goes back (no validation).

| Step | Required fields | Custom check |
|---|---|---|
| 1 | PAN, DOB, Prefix, First Name | PAN must have been validated |
| 2 | NRI With, Residential Status, Gender, Marital Status, Father/Spouse | Father/Spouse first name if visible |
| 3 | ≥1 NRI Type, ≥1 Product, Account Type, Contract Note, Account With | – |
| 4 | Link Existing DP | If **Yes**: for each selected side (NRE/NRO) DP name, DP id and 8-digit client id |
| 5 | Email, Mobile | Email validated, mobile validated |
| 6 | Admin, Sales Executive Code | Sales code validated |

**Save** (`saveFormDetails`) builds the payload and re-runs a full check `validateFormData` (same rules + "lead id if entered must be validated").

## 8. Save payload (`FormInward`)

```json
{
  "formNo": "<lblformno>", "panNo": "ABCDE1234F", "dob": "01/01/1990", "prefix": "Mr.",
  "Fname": "", "Mname": "", "Lname": "", "nameAsPerPan": "<NSDL name>",
  "gender": "M", "maritalStatus": "U", "isFatherOrHusband": "F", "fatherHusbandName": "first middle last",
  "fatherHusbandFname": "", "fatherHusbandMname": "", "fatherHusbandLname": "",
  "residentalStatus": "NRI", "nriCategory": "I",
  "eqFlag": "Y", "mfFlag": "N", "fnoFlag": "N", "currFlag": "N", "comFlag": "N",
  "nrePis": "Y", "nreNonPis": "N", "nroPis": "N", "nroNonPis": "N",
  "poa": "N", "billSchId": "5", "accountType": "I", "contractNote": "DIG", "accountWith": "NSDL",
  "isExistingDp": "N", "dpNreName": "", "NreDPId": "IN300513", "NreBeneficiaryId": "",
  "dpNroName": "", "NroDPId": "", "NroBeneficiaryId": "",
  "emailId": "", "emailRel": "0", "mobileNo": "", "mobileRel": "0",
  "telephoneNo": "", "telephoneNoISD": "",
  "branchCode": "<session branchId>", "servingBranchCode": "", "preferredBranchCode": "",
  "adminName": "<admin_id>", "leadId": "", "salesExcode": "", "remiserCode": "", "referingEmployeeCode": "",
  "hniFlag": "N", "entryBy": "<empId>", "updateBy": "<empId>",
  "loginId": "3442225", "enableACH": "N", "panlink_aadhar": "<SeedingStatus>", "scancopy1": ""
}
```

> `dpNreName` / `dpNroName` are not properties of the server `FormInward` model, so they are dropped on the server. `loginId` is **hard-coded** `"3442225"`.

**After save**

* `skReferenceNo` returned → success popup "Your Reference Number is: …" → redirect to
  * objection mode: `/Onboarding/nriaccountopening2/objectionforminward?formNo=&skrefno=`
  * normal: `/Onboarding/nriaccountopening2/forminward?formNo=&skrefno=` (the stage tracker, which then leads to stage 2 – Address).
* Empty `skReferenceNo` → error popup with `Description`.

## 9. Objection mode details

`GetFormDetailsonformid(skrefno)` pre-fills every field from `GetFormDetails` (`data[0]`), then:

* sets `isvalidpan = isvalidateemail = isvalidatemobile = 1`, marks those buttons green and disables PAN/DOB/email/mobile and their relations;
* marks lead / sales / remisier / ref-emp as validated if the value is non-empty;
* re-applies DP-block visibility from `isExistingDp`;
* uses `setDropdownValue` (polls every 100 ms until the option exists) for relation, admin and DP drop-downs.

`displayinwardObjectionBanner` shows `#objectionWarningBanner` ("N objections need your attention"); **View Details** opens `#inwardObjectionModal` listing `remarks` and each `Objection` text from the `objections` JSON.

## 10. Client-side state (globals in `inward2.js`)

| Variable | Meaning |
|---|---|
| `isvalidpan`, `isvalidateemail`, `isvalidatemobile` | 0/1 – server validation passed |
| `isvalidlead`, `isvalidSEC`, `isvalidRemisercode`, `isvalidRefEmpCode` | 0/1 – code validations |
| `panlinkwithaadhar` | PAN-Aadhaar seeding status from PAN check |
| `objectionCount` | >0 → objection mode |
| `currentStep` | Wizard position 1–6 |

## 11. Known issues / quirks to fix during migration

1. DP master options appear only after a fixed 5-second delay.
2. `getadmindetails` sends `masterCode: "52"` but the server always uses 3 (and 52 is actually form-status).
3. Email/Mobile relation lists show only `relationship_id == 0`.
4. `validatelead` failure shows a **check** icon instead of a cross; no error message.
5. `toggleFieldBasedOnValidation` checks for `btn-success`, but the code uses `btn-success-gradient` – the per-code checks are dead code.
6. Reset-PAN clears fields using a jQuery selector with a context argument (`$('#Divprocessform, …', '#divresidentialdeatils')`), which only searches *inside* the step-3 container where none of those ids live – so most fields are **not** actually cleared.
7. Objection prefill tests `form.leadid` (lower-case) – always truthy, so lead is always marked valid.
8. In objection mode with DP = No the DP id is always set to `12036000` (CDSL) even for NSDL.
9. Error handler of `GetFormDetails` references undefined `response`.
10. `loginId` hard-coded.

## 12. React migration notes

Suggested structure:

```
<InwardPage formNo skRefNo objection={...}>
  <ObjectionBanner/> + <ObjectionModal/>
  <Stepper steps={6} current>
    <PanIdentityStep/>      // PAN verify, DOB, NSDL name, prefix, names
    <PersonalDetailsStep/>  // nriWith, residentialStatus, gender, marital, father/spouse
    <ProductStep/>          // nriTypes → derived products, accountType, contractNote, accountWith
    <DpDetailsStep/>        // linkExistingDp, NRE/NRO DP panels
    <ContactStep/>          // <VerifiableField> email, mobile
    <BranchStep/>           // admin, preferred branch, <VerifiableField> lead/sales/remisier/ref
  </Stepper>
</InwardPage>
```

* Keep one form state object shaped like `FormInward`; derive products and DP ids with pure functions (`deriveProducts(nriTypes)`, `defaultDpId(accountWith)`).
* Model each "Validate + Reset" pair as a reusable `VerifiableField` component with status `idle | valid | invalid` instead of global 0/1 flags.
* Load masters with a data-fetching hook (React Query) instead of `setTimeout`/polling; step validation can then simply await data.
* Use a schema (Zod/Yup) per step reproducing §7.
