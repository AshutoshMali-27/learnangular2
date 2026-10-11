# Stage 9 – Extra Details / IPV (`extradetailspage`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/extradetailspage?formNo=&stageId=&skrefno=&...` |
| Controller action | `nriaccountopening2Controller.extradetailspage` |
| View | `Views/nriaccountopening2/extradetailspage.cshtml` ("Extradetails Stage") |
| Scripts | `validations.js`, `extradetails2.js` (+ Cropper.js) |
| Server APIs | [ExtraDetailsController.md](../API/ExtraDetailsController.md) |

## 1. Purpose

Captures the remaining KYC / compliance information:

* residence, income-source country, KMP (key managerial person) designation, insider / sensitive-product declarations;
* whether the client **has a bank account to link** (this decides whether the Bank Details stage is offered);
* investment / trading experience;
* the **IPV / OSV** (In-Person Verification / Original Seen & Verified) block: staff codes, names, designations, dates and signatures, which can be auto-filled from the TAB employee e-sign service;
* an optional Factiva screening upload.

## 2. Steps

| Step | Title |
|---|---|
| 1 | Extradetails Details + Investment/Trading Experience & Preference |
| 2 | IPV & Other Details (OSV, Interview, IPV approval, Factiva) |

Buttons: **Previous**, **Next** (validates step 1), **Save** (step 2).

## 3. Field inventory

### Step 1 (≈20 controls)

| # | Label | Id / name | Control | Req | Payload `OtherDetails.` |
|---|---|---|---|---|---|
| 1 | Country of Residence | `ddlCountryOfResidence` | select (country master) | – | `country_of_res` |
| 2 | Country Source Income | `ddlCountrySourceOfIncome` | select | – | `country_src_income` |
| 3 | Investment Through Sharekhan | `txtInvestmentThroughSharekhan` | text, numeric ≤ 2 decimals | – | `invstmnt_thrgh_shrkhn` |
| 4 | Nature of Business | `txtNatureOfBuisness` | text max 100, alnum | – | `nature_of_bus_desc` |
| 5 | KMP Designation | `ddlKMPDesignationID` | select (KMP master 17) | – | `kmp_desg_id` |
| 6 | Former Alias Name | `txtFormerAliasName` | text | – | `former_aliasesname` |
| 7 | Citizenship | `ddlCitizenship` | select | – | `citizenship` |
| 8 | Access Insider Info | radio `AccessInsiderInfo` (`1` / `0`) | – | `access_insider_info` |
| 9 | Remark | `txtAccessInsiderInfoRemark` | text | – | `access_insider_info_rmrks` |
| 10 | Sensitive Product Services | radio `SensitiveProductServices` (`1` / `0`) | – | `usg_sensitv_prdcts_servcs` |
| 11 | KMP Designation Description | `txtKMPDesignationDescription` | text | – | `kmp_desg_desc` |
| 12 | **Is Bank Available** | radio `isbankavaliable` (`chkyes` Y / `chkno` N) | **✔** | `is_bank_available` – drives Stage 11 visibility |
| 13 | Prior Investment Experience | checkbox `noexp` (`chkyes1`, value Y) | – | `is_prior_investment_expirience` |
| 14 | Years of Experience | `txtYearsOfExperience` with −/+ buttons | counter 0–99, enabled only when #13 ticked | ✔ (> 0) if #13 | `investment_expirience_yrs` |
| 15 | Years in Derivatives | `txtYearsInDerivatives` (counter) | – | `expirience_in_derivatives_yrs` |
| 16 | Years in Other Investment Fields | `txtYearsInOtherInvestment` (counter) | – | `other_investment_fields_expirience_yrs` |

Counters accept a single typed digit or ArrowUp / ArrowDown, and the ± buttons step by 1.

### Step 2 – IPV & Other Details (≈17 controls)

| Block | Label | Id | Req | Payload |
|---|---|---|---|---|
| OSV Verification | OSV Staff Code | `txtOSVStaffCode` | ✔ | `osv_staff_code` |
| | Name | `txtOSVStaffName` | ✔ | `osv_name` |
| | Designation | `txtOSVDesignation` | ✔ | `osv_desg` |
| | Date | `dtOSVDate` (≤ today, picker only) | ✔ | `osv_date` (`dd/MM/yyyy`) |
| | Signature | file `uploadsignaturefile` (`.jpg .jpeg .png`) + link `viewosvdetailspage` | ✔ | `osv_sign_path` |
| Interview Details | Interviewer Staff Code | `txtInterviewedStaffCode` | – | `interviewd_staff_code` |
| | Name / Designation | `txtInterviewedName`, `txtInterviewedDesignation` | – | `interviewer_name`, `interviewer_desg` |
| | Date | `dtInterviewedDate` (≤ today) | – | `interviewed_date` |
| | Interviewed Place | `txtIPVInterviewedPlace` | – | `tipvverplace` |
| | Signature | file `fileInterviewedSignature` + link `viewinterviewsignspage` | – | `interviewer_sign_path` |
| IPV Approval | IPV Approval Code | `txtIPVEmployeeCode` | ✔ | `tipvempcode` |
| | Name / Designation | `txtIPVName`, `txtIPVDesignation` | ✔ | `ipv_name`, `ipv_desg` |
| | Date | `dtIPVVerificationDate` (≤ today) | ✔ | `dipvverificationdt` |
| | Signature | file `fileIPVSignature` + link `viewipvsignspage` | ✔ | `ipv_sign_path` |
| Factiva | Factiva Upload | file `filefactivaupload` (`.jpg .jpeg .png .pdf .eml`) + link `viewfacivaupload` | – | `factiva_upload_path` |

Other payload values: `lipvbranchid` = session branch id, `country_of_res_oth` / `country_src_income_oth` = `""`.

## 4. Field connections

| Trigger | Effect |
|---|---|
| Prior investment experience ticked / unticked | Enables / disables and resets the three year counters |
| OSV / Interviewer / IPV staff code **changed** | `ExtraDetails/GetesigndetailsDetails "<code>"` → TAB e-sign service. If found, fills code / name / designation, locks the code field, converts the base64 `EmpSign` into a file and **uploads it automatically** as that block's signature |
| Signature / Factiva file chosen | Images open the crop editor and then upload; other files upload directly → `ExtraDetails/UploadFile` (`signproofFile`, `formno`, `panno`) → link shows "View: <file>" |
| View link clicked | `NRIAccountOpening/GetDocument` blob → new tab |
| "Is Bank Available" | Saved as `is_bank_available`; the tracker later hides / blocks the Bank Detail stage when `N` |

## 5. Page load

| Call | Use |
|---|---|
| `NRIAccountOpening/getCountrymaster` | Residence, source-of-income, citizenship drop-downs |
| `NRIAccountOpening/getKMPDesignationMaster` | KMP designation |
| `NRIAccountOpening/GetInProcessData` | `Pan_No`, `Email_Id` |
| (objection mode) `ExtraDetails/GetExtraDetails "<skrefno>"` | Pre-fill, after masters are loaded (`masterDataReady` promise); objection banner |

## 6. Save

`POST /Onboarding/ExtraDetails/SaveExtraDetails`, `multipart/form-data`, field `model`:

```json
{
  "FormEntryID": "<skrefno>", "EmployeeCode": "<empId>", "panno": "<PAN>", "formno": "<formNo>",
  "OtherDetails": {
    "is_bank_available": "Y",
    "osv_staff_code": "", "osv_name": "", "osv_desg": "", "osv_date": "01/06/2025", "osv_sign_path": "",
    "interviewd_staff_code": "", "interviewer_name": "", "interviewer_desg": "", "interviewed_date": "", "interviewer_sign_path": "",
    "tipvempcode": "", "ipv_name": "", "ipv_desg": "", "dipvverificationdt": "", "ipv_sign_path": "",
    "lipvbranchid": "<branchId>", "tipvverplace": "",
    "country_of_res": "0", "country_of_res_oth": "", "country_src_income": "0", "country_src_income_oth": "",
    "invstmnt_thrgh_shrkhn": "", "nature_of_bus_desc": "", "kmp_desg_id": "0", "kmp_desg_desc": "",
    "access_insider_info": "N", "access_insider_info_rmrks": "", "usg_sensitv_prdcts_servcs": "N",
    "former_aliasesname": "", "citizenship": "0", "factiva_upload_path": "",
    "is_prior_investment_expirience": "N", "investment_expirience_yrs": "0",
    "expirience_in_derivatives_yrs": "0", "other_investment_fields_expirience_yrs": "0"
  }
}
```

Save validation (`validateOtherDetails`): OSV code / name / designation / date / signature, and IPV code / name / designation / date / signature.

**After save:** "Extra details saved successfully!" → `forminward` / `objectionforminward`.

## 7. Known issues

1. Radio defaults: `access_insider_info` / `usg_sensitv_prdcts_servcs` fall back to `"N"`, while their radio values are `1` / `0`.
2. The step-2 Next check looks for `.show-document-btn-*` elements that don't exist; only the uploaded-path check on Save is effective.
3. The interview signature is saved as `interviewer_sign_path` but read back as `ipv_interviewer_path`.
4. Typing a digit into a counter **replaces** the value with that single digit (you cannot type "12").
5. On TAB lookup failure `alert()` is used instead of SweetAlert.

## 8. React migration notes

* `<StaffVerificationBlock kind="OSV|INTERVIEW|IPV" required />`, a reusable block that looks up the employee code and auto-attaches the signature.
* `<NumberStepper min=0 max=99 />` for experience years.
* Expose `isBankAvailable` in the shared journey state, because the Bank stage depends on it.
