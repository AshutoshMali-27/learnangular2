# Stage 6 – Nominee (`nominee`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/nominee?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.nominee` |
| View | `Views/nriaccountopening2/nominee.cshtml` |
| Scripts | `validations.js`, `nomineepage2.js` (+ Cropper.js) |
| Server APIs | [NomineeController.md](../API/NomineeController.md) |

## 1. Purpose

Records the client's choice to **opt in or opt out of nomination**. If opting in, it captures nominees **separately for the NRE and NRO accounts** (whichever the client opened in Inward). Each nominee has proof, identity, share %, relation, address and contact. A **guardian** is required when the nominee is a minor (< 18). The shares per account must total exactly 100 %.

## 2. Screen flow

```
(1) "Do you want to add Nominee?"  ( ) Yes  ( ) No          ← #nomineeoptstatus
        │No  → saves NomOpt = "N" immediately → back to forminward
        │Yes
(2) Account cards: [NRE Account] [NRO Account]   [Final Submit]   [← Back to form inward]   ← #nomineeyesselect
        │click card (only if that account type exists)
(3) #nrenominnee:  "NRE" header  [Back to cards]  [+ Add Nominee (#nomineeYes)]
        ├ #divfornominee  ← nominee wizard (2 steps, or 4 with guardian)
        └ #tblnomineedetails ← nominee cards (name, proof, "NRE Nominee n", share %, guardian yes/no, Edit)
```

| Element | Rule |
|---|---|
| NRE card | Enabled when `Nre_Pis` or `Nre_Nonpis` = Y (from `GetInProcessData`); shows "Nominees: n \| x% allocated" or "✓ Complete" |
| NRO card | Enabled when `Nro_Pis` or `Nro_Nonpis` = Y |
| Add Nominee | Blocked when that account's share total is already 100 %; disabled at 10 nominees |
| Final Submit (`#btnfinalsubmit`) | Shown on the cards screen only when every **active** account type has nominees totalling exactly 100 % |
| Back to cards | Disabled while the wizard is open |

## 3. Nominee wizard

Total steps = **2** (adult nominee) or **4** (minor nominee → guardian steps 3–4). The count is recalculated when the nominee DOB changes (`setGuardian`). Buttons: **← Previous**, **Next →**, **Save** (adds or updates the nominee **in memory**). ✕ (`.btnclose`) discards.

### Step 1 – Nominee Information (11 controls)

| # | Label | Id | Control | Req | Validation / behaviour | Payload |
|---|---|---|---|---|---|---|
| 1 | Proof Type | `ddlnomineeprooftype` | select – document master filtered to ids `3` PAN, `5` Passport, `74` Aadhaar, `2` | ✔ | Change clears proof number | `ProofTypeID` |
| 2 | Proof Number | `txtnomineeProofNo` | text | ✔ | PAN `^[A-Z]{5}[0-9]{4}[A-Z]$`; Passport `^[A-PR-WY][1-9]\d{6}$`; Aadhaar – on blur 4 digits, on Next 12 digits (inconsistent); cannot equal guardian proof or the client PAN | `ProofNumber` (upper-case) |
| 3 | Prefix | `ddlnomineedprefix` | Mr./Mrs./Miss/Ms./Dr. | ✔ | | `NamePrefix` |
| 4–6 | First / Middle / Last Name | `txtnomineeFname`, `txtnomineeMname`, `txtnomineeLname` | text max 50, letters only | First ✔ | | `FirstName`, `MiddleName`, `LastName` |
| 7 | Date of Birth | `txtnomineeDOB` | date ≤ yesterday, picker only | ✔ | Age < 18 → guardian steps added | `DateOfBirth` (`dd/MM/yyyy`), `IsGuardianPresent` (Y if < 18) |
| 8 | Shares % | `txtnomineeshares` | text, digits | ✔ | 1–100; account total ≤ 100 | `ShareOfNominee` |
| 9 | Relationship | `ddlnomineerelation` | select (nominee-relation master 14) | ✔ | `13` (Other) → shows `txtnomineerelationother` | `RelationshipID` |
| 10 | Relationship – other | `txtnomineerelationother` | text max 50 | if 13 | | `RelationshipOther` |

### Step 2 – Nominee Address & Contact (11 controls)

| # | Label | Id | Req | Payload |
|---|---|---|---|---|
| 11–13 | Address 1/2/3 | `txtnomineeAddress1..3` (max 50, address char rules) | Address 1 ✔ | `AddressLine1..3` |
| 14 | Country | `ddlnomineecountry` → loads states | ✔ | `CountryID` |
| 15 | State | `ddlnomineestate` → loads cities | ✔ | `StateID` |
| 16 | City | `ddlnomineeCity` | ✔ | `CityID` |
| 17 | PinCode | `txtnomineepincode` (6 digits) | ✔ | `Pincode` |
| 18 | Mobile No | `txtnomineemobileno` (digits, max 15) | ✔ | `MobileNumber` |
| 19 | Tele No | `txtnomineetelno` | – | `TelephoneNumber` |
| 20 | Email | `txtnomineeemail` (blocked domains sharekhan.com / miraeassetcm.com) | ✔ | `EmailID` |
| 21 | Upload Nominee Proof | file `uploadnomineefile` (`.jpg .jpeg .png .pdf`) + link `shownomineefile` | – | `NomineeProofPath` |

### Step 3 – Guardian Information (minor nominee only, 9 controls)

| Label | Id | Req | Rules | Payload (`GuardianDetails.`) |
|---|---|---|---|---|
| Proof Type | `ddlguardianprooftype` (PAN only) | ✔ | | `ProofTypeID` |
| Proof Number | `txtguardianProofNo` | ✔ | PAN format; ≠ nominee proof; ≠ client PAN | `ProofNumber` |
| Prefix | `ddlguardiandprefix` | ✔ | | `NamePrefix` |
| First / Middle / Last | `txtguardianFname`, `…Mname`, `…Lname` | First ✔ | letters only | `FirstName/MiddleName/LastName` |
| DOB | `txtguardianDOB` (max = today − 18 years) | ✔ | guardian ≥ 18 | `DateOfBirth` |
| Relation with Nominee | `ddlguardianrelation` (+ `txtguardianrelationother` when 13) | ✔ | | `RelationshipID`, `RelationshipOther` |

### Step 4 – Guardian Address & Contact (11 controls)

`txtguardianAddress1..3`, `txtguardianpincode`, `ddlguardiancountry/state/City`, `txtguardianmobileno`, `txtguardiantelno`, `txtguardianemail`, file `uploadguardianfile` + `showguardianfile`. Address 1, pincode, country/state/city, mobile, email and the **guardian proof file are required**. Payload: same names under `GuardianDetails` + `GuardianProofPath`.

## 4. Save-time cross checks (in-memory add)

* Account share total + this nominee ≤ 100 %.
* Nominee vs guardian: proof number, email, telephone, mobile must differ.
* Nominee / guardian proof must not equal the client PAN.
* Against other nominees of the same account: no duplicate proof number, email, telephone, mobile or full name (nominee or guardian).
* `NomNo` = position (1-based). Max 10 nominees per account.

## 5. Final submit payload

`POST /Onboarding/Nominee/SavenomineeData` as `multipart/form-data`, field `model` = JSON:

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "NomOpt": "Y",
  "formno": "<formNo>",
  "panno": "<client PAN>",
  "NomineeDetails": [{
    "Segment": "1", "NomNo": "1", "NRIType": "NRE",
    "NamePrefix": "Mrs.", "FirstName": "", "MiddleName": "", "LastName": "",
    "PanNumber": "", "AadhaarNumber": "",
    "ProofTypeID": "3", "ProofNumber": "ABCDE1234F", "NomineeProofPath": "",
    "RelationshipID": "1", "RelationshipOther": "", "DateOfBirth": "15/08/1990",
    "AddressLine1": "", "AddressLine2": "", "AddressLine3": "",
    "CityID": "", "StateID": "", "CountryID": "", "Pincode": "",
    "TelephoneNumber": "", "FaxNumber": "", "MobileNumber": "", "EmailID": "",
    "BankAccountNumber": "", "ProofDetails": "", "DpID": "", "DpClientID": "",
    "IsGuardianPresent": "N", "DeclarationDetail": "N", "DeclarationFlag": "N",
    "DeclarationNRE": "Y", "DeclarationNRO": "N",
    "ShareOfNominee": "100", "NOM_RESID_PAYBL": "N",
    "GuardianDetails": { "...": "same shape; server nulls it when IsGuardianPresent != Y" }
  }]
}
```

NRE and NRO nominees are combined into one `NomineeDetails` array (distinguished by `NRIType` / `DeclarationNRE` / `DeclarationNRO`). Before sending, each active account must total exactly 100 %.

**Opt-out (No):** `POST /Onboarding/Nominee/SavenomineeDataforNoNominee` with `{ FormEntryID, EmployeeCode, NomineeDetails: [], NomOpt: "N" }` → back to `forminward`.

**After save:** "Nominee details saved successfully!" → `forminward` / `objectionforminward`.

## 6. API calls

| When | Endpoint | Purpose |
|---|---|---|
| Load | `Proof/getdocumentmaster {masterCode:"18"}` | Proof types (filtered client-side) |
| Load | `NRIAccountOpening/GetInProcessData` | `Nre_*`/`Nro_*` flags, `Pan_No` |
| Load | `Nominee/getrelationmaster` ×2 | Nominee and guardian relations |
| Load | `NRIAccountOpening/getCountrymaster` ×2 | Countries |
| Cascades | `NRIAccountOpening/getStatemaster`, `getCitymaster` | States / cities |
| Objection mode | `Nominee/getNomineeonformid "<skrefno>"` | Splits saved nominees into NRE / NRO lists |
| Upload | `Nominee/UploadFile` (`proofFile`, `formno`, `panno`) | Nominee / guardian proof (images via crop editor) |
| View file | `NRIAccountOpening/GetDocument` | |
| Save | `Nominee/SavenomineeData` / `Nominee/SavenomineeDataforNoNominee` | |

## 7. Known issues

1. Aadhaar validation differs between blur (4 digits) and Next (12 digits).
2. In the save cross-check, the variables `nomineeMobile` / `guardianMobile` read each other's fields (they are swapped). The comparison still works, but the naming is wrong.
3. `clearNomineeForm()` clears **every** input and select on the page (`$('input, textarea')`), including hidden server values (it is unused, but dangerous).
4. The objection banner title says "Objections Pending for **Proof** Stage" (copy-paste).
5. Choosing **No** saves immediately without confirmation.
6. `callGetExistingCustomerDetails` exists but is never called.

## 8. React migration notes

* State: `optIn: boolean | null`, `nominees: { NRE: Nominee[], NRO: Nominee[] }`, `activeAccount: 'NRE'|'NRO'|null`.
* Derived: `availableAccounts` (from in-process flags), `shareTotal[acct]`, `canFinalSubmit`, `needsGuardian = age(dob) < 18` → step list `[info, address, ...(needsGuardian ? [guardianInfo, guardianAddress] : [])]`.
* Reuse `<AddressForm>`, `<FileUpload>`. The cross-nominee uniqueness checks become a single validator over the list.
