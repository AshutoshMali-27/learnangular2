# Stage 4 – FATCA / CRS Declaration (`fatca`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/fatca?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.fatca` |
| View | `Views/nriaccountopening2/fatca.cshtml` |
| Scripts | `validations.js`, `fatcapage2.js` (+ Cropper.js for image editing) |
| Server APIs | [FatcaController.md](../API/FatcaController.md) |

## 1. Purpose

Collects the **FATCA / CRS self-declaration** for every account holder: place of birth, occupation (and employer / business details), residence, income and wealth, nationality / citizenship, PEP and US-person status, and up to **3 foreign tax residencies** with TIN validation and proof upload.

One FATCA record is needed **per holder** (1st = `TRD`, 2nd = `2ND`, 3rd = `3RD`). Records are kept in browser memory (`fatcaList[0].FatcaData`) and shown as cards. The final **submit** button posts them all at once.

## 2. Screen layout

```
┌ "Fatca Details"                                   [+ Add FATCA] ┐
│ Objection banner                                                │
│ #Divfatcaform     ← 3-step FATCA wizard (hidden until Add/Edit)  │
│ #fatcaGridWrapper ← FATCA cards (holder, country, income/net-worth slab, net worth, Edit) │
│                                                       [submit]  │  ← #btnretruntostepper
└─────────────────────────────────────────────────────────────────┘
Modals: #pepWarningModal, #fatcaObjectionModal, #imageCropModal (crop/rotate/zoom before upload)
```

| Rule | Detail |
|---|---|
| Max FATCA records | = `HolderCount` from `GetInProcessData` (1, 2 or 3). "Add" beyond that shows "You can only add up to N FATCA entries for N holder(s)." |
| Holder type of next record | Auto and **disabled**: 0 records → `TRD`, 1 → `2ND`, 2 → `3RD` (`checktoaddfatca`) |
| **submit** button shown | only when `HolderCount == number of FATCA records` |

## 3. Wizard – 3 steps

Buttons: **← Previous**, **Next →**, **Save** (last step; adds or updates the record **in memory**). The ✕ button (`.btnclose`) on each step discards the record.

### Step 1 – Birth, Occupation, Financial and Nationality details (≈20 controls)

| # | Label | Id | Control | Req | Behaviour | Payload key |
|---|---|---|---|---|---|---|
| 1 | Holder Type | `ddlholderforfatca` | select `TRD` / `2ND` / `3RD` | ✔ | Auto-set and disabled | `HOLDERTYPE` |
| 2 | Country of Birth | `ddlCountryOfBirth` | select (country master) | ✔ | India (`2`) → show city drop-down, else show free-text place | `CO_BIR_INC` |
| 3 | Place of Birth | `txtOtherCountry` (text, letters only, max 50) / `ddlcityofbirth` (select, FATCA city master) | text / select | – | India → selected city **text**, otherwise the typed place | `PO_BIR_INC` |
| 4 | Occupation | `ddlfatcaoccupation` | select (occupation master) | ✔ | Shows / hides the employer / business / other blocks (§4, only for `TRD`) | `OCC_ID` |
| 5 | Employer Name | `txtfatcaemployername` (in `#divemployee`) | text max 100, alnum . space | cond. | | `EMPLOYER_NAME` |
| 6 | Employer Country | `ddlCountry` | select (country master) | cond. | | `EMPLOYER_COUNTRY` |
| 7 | Employer Address | `txtemployeeraddress` | text max 50 | cond. | | `EMPLOYER_ADDRESS` |
| 8 | Nature of Business | `txtNatureOfBuisness` (in `#divbuiseness`) | select (master 44) | cond. | | `NATURE_BUS` |
| 9 | Other Occupation Details | `txtWorkDetails` (in `#divother`) | text max 200 | cond. | | `OCC_OTHER_NAME` |
| 10 | Country of Residence | `ddlCountryOfResidence` | select | ✔ | For `TRD`: India not allowed unless NRI category = Mariner (`M`) | `COUNTRY_OF_RESIDENCE` |
| 11 | Income Slab | `ddlFatcaIncome` | select (income master 13) | ✔ | | `INC_SLAB_ID` |
| 12 | Source of Wealth | `ddlFatcaSource` | select (source-of-wealth master) | ✔ | `08` (Others) → shows `txtsourceofwealth` | `SRCE_WEALT` |
| 13 | Source of Wealth – other | `txtsourceofwealth` | text max 50 | if `08` | | `SRCE_WEALT_OTH` |
| 14 | Net Worth | `txtnetworth` | text, numeric with ≤ 2 decimals, > 0 | ✔ | | `NET_WORTH` |
| 15 | Net Worth As on Date | `txtnetworthdate` | date | ✔ | Range: today – 1 year … today; typing / paste blocked (picker only) | `NW_DATE` |
| 16 | Nationality | `txtnationality` + `ul#nationalitysuggestionsList` + hidden `hdnCountryCode` | autocomplete | ✔ | After 2+ letters calls the nationality master; must pick a suggestion (otherwise cleared on blur) | `NATIONALITY` = code, `NATIONALITY1` = name (UI only) |
| 17 | Citizenship | `ddlCitizenship` | select (country master) | ✔ | | `CITIZENSHIP` |

### Step 2 – PEP and US person (≈11 controls)

| # | Label | Id / name | Options (value) | Req | Payload |
|---|---|---|---|---|---|
| 18 | Politically Exposed Person | radio `pepdetails` | Non PEP (`8`), PEP (`1`), Relative of PEP (`2`), Bureaucrat (`3`), Civil Servant (`4`), Politician (`5`), Current/Former MP, MLA or MLC (`6`), Current/Former Head of State (`7`) | ✔ | `PEP_FLAG` |
| 19 | PEP Approval Document | file `uploadPEPFile` (`.jpg .jpeg .png .pdf .eml`, ≤ 5 MB) + link `showPEPFile` | – | required when holder = `TRD` and PEP = `1` | `PEP_APPROVAL_UPLOAD_PATH` |
| 20 | Are you a US Person? | radio `isusperson`: `chkyesusperson` (`Y`), `chknonusperson` (`N`) | ✔ | `US_PERSON_FLG` |

Selecting **PEP** for the first holder opens `#pepWarningModal`: *"As you have identified the client as a Politically Exposed Person (PEP), additional approval is required from compliance before proceeding. An approval email must be uploaded."*

### Step 3 – Tax residency outside India (≈25 controls)

| # | Label | Id | Req | Payload |
|---|---|---|---|---|
| 21 | Do you have tax residency outside India? | radio `isindianresidency` (`Y` / `N`) | ✔ | `TAX_RES_OTH_CNTRY_FLG` |
| – | Residency table `#divOtherResidencyTable` | shown only when `Y` | | |

Three identical residency rows (n = 1, 2, 3):

| Field | Id | Req (row 1 when `Y`) | Payload |
|---|---|---|---|
| From Date | `txtfromdate{n}` (date ≤ today, picker only) | see issue #1 | `FROM_DATE{n}` |
| Country | `country{n}` (FATCA country master, option carries `data-fatca-country-code`) | ✔ | `TAX_RES{n}` (country id) |
| TIN | `tin{n}` (alnum . -) | ✔ | `TPIN{n}` |
| Identification Type | `idType{n}` (only `T` = TIN) | ✔ | `ID{n}_TYPE` |
| Proof upload | file `tinidproof{n}` (`.jpg .jpeg .png .pdf`) + link `viewTinIdProof{n}` | ✔ before validating | `TIN{n}_PROOF_PATH` |
| Validate | `validateResidency{n}` | must succeed | – |
| Clear | `btnclearresidency{n}` | – | – |

Rules:

* India (`2`) cannot be chosen as a tax-residency country.
* Rows unlock **sequentially** (`updateResidencyAccess`): row 2 is enabled only after row 1 is validated, row 3 only after row 2. A validated row is locked.
* Validate → `Fatca/ValidateResidency{n}` with the **FATCA country code** (not id) and TIN; success when `message === "1"` and `isValid === true`.
* Switching to `N` clears all three rows and their uploads.

Constant / unused keys sent as `""`: `PEKRN`, `DATA_SRC`, `ADDR_TYPE`, `TAX_RES4`, `TPIN4`, `ID4_TYPE`, `CORP_SERVS`, all `GIIN_*`, `FFI_*`, `NFFE_*`, `UBO_*` (entity / UBO fields), `SDFLAG`, `LOG_NAME`, `FILLER1/2`, `*_FLG` money-lending etc., `DP_ID`, `PEP_DETAILS`, `OTHER_DETAILS`, `DATE_OF_INC`, `REP_MOD_FFI1/2`, `ACC_TY_US_PERSON`, `TIN4_PROOF_PATH`, `FROM_DATE4`.

## 4. Occupation-driven blocks (holder `TRD` only)

| Occupation id | Employer block (`#divemployee`) | Business block (`#divbuiseness`) | Other block (`#divother`) | Extra required fields |
|---|---|---|---|---|
| `2`, `3`, `26`, `136` | show | hide | hide | Employer name, country, address |
| `25` | show | show | hide | + Nature of business |
| `31` | hide | hide | show | Other occupation details |
| anything else / joint holder | hide | hide | hide | – |

Occupation change clears all of those fields.

## 5. File upload flow (TIN proofs and PEP document)

1. A file is chosen in `tinidproof{n}` / `uploadPEPFile`.
2. **Images** open `#imageCropModal` (Cropper.js – zoom in/out, rotate ±90°, reset, **Crop & Upload**). The cropped image is re-encoded as JPEG (quality 0.9, max 3000 px). PDFs / `.eml` upload directly.
3. Upload: `multipart/form-data` to
   * TIN proof → `POST /Onboarding/Fatca/UploadFile` (field `signproofFile`, `formno`, `panno`)
   * PEP → `POST /Onboarding/Fatca/UploadPEPFile` (field `proofFile`, `formno`, `panno`, `pepFlag=Y`)
4. Response `filePath` is stored in the link's `data-filepath`, and the link becomes "View: <fileName>".
5. **View** → `GET /Onboarding/NRIAccountOpening/GetDocument?formNo=&panNo=&path=` as blob → opened in a new tab.

## 6. Page load and data flow

| Step | Call | Purpose |
|---|---|---|
| 1 | Masters: `NRIAccountOpening/getCountrymaster` (×4: birth, employer, residence, citizenship), `Fatca/getfatcaCountrymaster` (tax countries), `Fatca/getnatureofbusinesslist`, `holder/getoccupationdetails`, `OtherDetails/getIncomeforfamilySlab`, `Fatca/getfatcasourceofwelth` (`masterCode:"16"`), `fatca/getCitymasterforfatca` | Drop-downs |
| 2 | `NRIAccountOpening/GetInProcessData {formNumber}` | `HolderCount`, `Pan_No`, `Nri_Category` |
| 3a (new) | `Fatca/GetExistingCustomerDetailsforfatca {panNo, searchText:"FATCA"}` | If the PAN is an existing customer, pre-fills FATCA cards from `statedetails` |
| 3b (objection) | `Fatca/getFatcaonformid "<skrefno>"` | Loads saved FATCA records into cards + objection banner |
| Typing nationality | `Fatca/getNationalitylist {masterCode:"19", parameter1:<text>}` | Suggestions |
| Validate residency n | `Fatca/ValidateResidency{n}` | TIN structure check |
| submit | `Fatca/SaveFatcaData` | Save all records |

## 7. Save payload (`FatcaDetailsRequest`)

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "FatcaData": [{
    "HOLDERTYPE": "TRD", "CO_BIR_INC": "2", "PO_BIR_INC": "MUMBAI",
    "OCC_ID": "2", "EMPLOYER_NAME": "", "EMPLOYER_COUNTRY": "", "EMPLOYER_ADDRESS": "", "NATURE_BUS": "", "OCC_OTHER_NAME": "",
    "COUNTRY_OF_RESIDENCE": "", "INC_SLAB_ID": "", "SRCE_WEALT": "", "SRCE_WEALT_OTH": "",
    "NET_WORTH": "1000000", "NW_DATE": "2025-06-30", "NATIONALITY": "IN", "CITIZENSHIP": "",
    "PEP_FLAG": "8", "PEP_APPROVAL_UPLOAD_PATH": "", "US_PERSON_FLG": "N",
    "TAX_RES_OTH_CNTRY_FLG": "Y",
    "FROM_DATE1": "", "TAX_RES1": "", "TPIN1": "", "ID1_TYPE": "T", "TIN1_PROOF_PATH": "NRI000123_ABCDE1234F/fatca_tin_....pdf",
    "FROM_DATE2": "", "TAX_RES2": "", "TPIN2": "", "ID2_TYPE": "", "TIN2_PROOF_PATH": "",
    "FROM_DATE3": "", "TAX_RES3": "", "TPIN3": "", "ID3_TYPE": "", "TIN3_PROOF_PATH": "",
    "...": "all other FATCA keys sent as empty strings (see §3)"
  }]
}
```

UI-only keys (`NATIONALITY1`, `OCC_TEXT`, `NC_SLAB_TEXT`, `countryOfBirth_text`, `HOLDERTYPE_text`, `NATIONALITY1_text`) are also sent but ignored by the server (`[JsonIgnore]`).

**After save:** `message === "Success"` → "Fatca details Saved successfully" → `forminward` (or `objectionforminward`).

## 8. Validation summary

| Step | Checks (`validateCurrentStep`) |
|---|---|
| 1 | Holder type, country of birth, occupation, country of residence, citizenship, income, source of wealth, net worth, net-worth date, nationality; occupation-specific employer / business / other fields for `TRD` |
| 2 | PEP selected; PEP document for `TRD` + PEP; US person selected |
| 3 | Tax-residency answer; if `Y`: row-1 date (see bug), country, TIN, id type, validated |

Save additionally runs `validateFatcaDetails()` (same core checks) and `validateTaxResidencies()` (row 1 must be validated; rows 2 and 3 must be validated if they have a proof).

## 9. Known issues

1. Step-3 check `if (!$('#txtfromdate1').val() == "")` is inverted: it shows "Please Enter From Date" when a date **is** entered and passes when it is empty.
2. The card label says "Net Worth Slab" but shows the **income slab** text (`NC_SLAB_TEXT` – a misspelling of `INC_SLAB_TEXT`, kept only in the browser). Cards rebuilt from the server use `inc_slab` and are labelled "Income Slab", so the two card variants differ.
3. `bindfatcaGrid` calls `.reverse()` on the live array, so the order flips on every rebind.
4. Server `getFatcaonformid` swaps `NATIONALITY` / `nationality_id` (see API doc). The edit screen compensates with `data.nationality_id ?? data.NATIONALITY1`.
5. `$('#ddlCountry')` is used for the employer country, a generic id that is easy to clash with.
6. Card HTML is not escaped.

## 10. React migration notes

* `fatcaRecords: FatcaRecord[]` limited to `holderCount`; holder type derived from index.
* Split into `<BirthAndOccupation/>`, `<FinancialProfile/>`, `<NationalityPicker/>` (async autocomplete), `<PepDeclaration/>`, `<TaxResidencyList max={3}/>` with sequential unlock as derived state.
* `<FileUpload accept crop />` component wrapping the cropper and upload API, returning the stored `filePath`.
* Keep the long FATCA payload builder in one mapper (`toFatcaPayload(record)`) that fills the constant empty keys.
