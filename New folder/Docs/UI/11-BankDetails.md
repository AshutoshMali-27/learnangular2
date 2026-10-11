# Stage 11 – Bank Details (`bankdetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/bankdetails?formNo=&stageId=&skrefno=&...` |
| Controller action | `nriaccountopening2Controller.bankdetails` |
| View | `Views/nriaccountopening2/bankdetails.cshtml` ("Bankdetails Stage") |
| Scripts | `validations.js`, `bankdetails2.js` (+ Cropper.js) |
| Server APIs | [BankDetailController.md](../API/BankDetailController.md) |
| Reached when | Extra Details answered **Is Bank Available = Y** and Brokerage is saved |

## 1. Purpose

Links the client's Indian bank accounts to each NRI account type opened in Inward (NRE PIS, NRE NON-PIS, NRO PIS, NRO NON-PIS). Each account is looked up by IFSC, validated by a **bank check** (penny-drop / CheckBank API), and supported by one common **Bank Letter** upload. This is the last data-entry stage; after saving, the journey ends on the success page.

## 2. Screen layout

```
┌ Objection banner                                                         ┐
│ [NRE PIS Select] [NRE NON-PIS Select] [NRO PIS Select] [NRO NON-PIS Select]   ← #bankdetailsTypeContainer │
│ Bank Letter *  [Choose File] → "View Document"                ← #inputbankupload (common)  │
│ [Submit All Bank Details]   ← injected when all enabled types are completed               │
│ ┌ form for the selected type (#nre_pis / #nre_nonpis / #nro_pis / #nro_nonpis) ─ ✕ ┐       │
└──────────────────────────────────────────────────────────────────────────┘
Modals: #bankObjectionModal, #bankImageCropModal
```

| Card | Enabled when (from `GetInProcessData`) | Form | Accounts in form |
|---|---|---|---|
| NRE PIS | `Nre_Pis = Y` | `#nre_pis` (2 steps: Prev / Next / Submit) | Step 1 **Primary** (PIS) account + Step 2 **NRE SB** (secondary savings) account |
| NRE NON-PIS | `Nre_Nonpis = Y` | `#nre_nonpis` | Primary account only (always default) |
| NRO PIS | `Nro_Pis = Y` | `#nro_pis` (2 steps) | Primary + **NRO SB** secondary |
| NRO NON-PIS | `Nro_Nonpis = Y` | `#nro_nonpis` | Primary only (always default) |

Rules:

* All cards start **disabled** until the common Bank Letter is uploaded successfully.
* Cards for account types not opened are permanently disabled (`card-disabled`) and treated as complete.
* Opening a form disables the other cards. ✕ closes it.
* A form's **Submit** validates that form, then marks the card "Completed" (in memory only).
* When every enabled type is completed, **Submit All Bank Details** (`#finalBankDetailsSubmit`) is injected below the cards.

## 3. Account block fields (same for each of the 6 account blocks)

Id prefixes: `nrepisprimary`, `nrepissecondary`, `nrenonpisprimary`, `nropisprimary`, `nropissecondary`, `nrononpisprimary`.

| # | Label | Id (prefix + …) | Control | Req | Behaviour | Payload `BankDetails[i].` |
|---|---|---|---|---|---|---|
| 1 | IFSC Code | `txt{prefix}ifscid` (secondary NRE: `nrepissecondaryifsccode`) | text + suggestion list | ✔ | After ≥ 6 chars (250 ms debounce) → `BankDetail/GetIfscList {masterCode:"11", parameter1}`. Picking a suggestion fills bank name, branch name and the hidden branch id / IFSC labels | `IfscCode` (from hidden `{prefix}ifscid` label) |
| 2 | Bank Name | `{prefix}bankname` | read-only | – | auto | – |
| 3 | Branch Name | `{prefix}branchname` | read-only | – | auto | – |
| – | (hidden) branch id | `{prefix}branchid` label | – | – | `Bank_Branch_Id` | `BankBranchID` |
| 4 | Account Number | `{prefix}accountno` | text, alphanumeric | ✔ | Must be unique across the PIS primary / secondary fields | `AccountNumber` |
| 5 | Account Type | `{prefix}accounttype` | select: Savings (`0`) – "Current" is commented out | ✔ | | `AccountType` |
| 6 | RBI Reference Number | `{prefix}rbirefno` | text, upper-case, `A-Z 0-9 / \ - . space` | ✔ for PIS blocks | | `RBIReferenceNumber` |
| 7 | RBI Ref date | `{prefix}rbirefdate` | date ≤ today | ✔ for PIS blocks | | `RBIApprovalDate` |
| 8 | Bank Letter (per account) | `{prefix}uploadchequeleaf` | file – hidden column, not used | – | | – |
| 9 | Set as Default Account | `{prefix}isdefault` | checkbox | – | PIS primary vs secondary are mutually exclusive. NON-PIS primary is always default (checked + disabled) | `IsDefault` (`1`/`0`) |
| 10 | Validate Bank | `btnvalidate{prefix}` | button | must succeed before Next / Submit | `BankDetail/CheckBank` | – |
| 11 | Reset | `btnreset{prefix}` | button | – | Clears the block and validation | – |

Common upload: **Bank Letter** `#inputbankupload` (`.jpg .jpeg .png .pdf`, images go through the crop editor) → `POST BankDetail/UploadChequeLeaf` (`chequeLeafFile`, `formno`, `panno`) → `#viewbankupload` link. Its path is sent as `ChequeLeafUploadPath` for **every** account (`ChequeLeafUploadFlag` = `Y` when present).

## 4. Validate Bank → `POST /Onboarding/BankDetail/CheckBank`

Pre-checks: account number, IFSC (selected), branch id and account type present.

```json
{ "PanNo": "<client PAN>", "AccountNo": "000123456789", "IfscCode": "HDFC0000001", "BankBranchId": "3456", "AccountType": "0", "NriType": "nre_pis" }
```

| Response `Message` | UI |
|---|---|
| `Success` | "Bank account details are valid." → button turns green "Validated", block flag set |
| `Failed` | "Validation Failed" |
| other | "Validation Warning" with `data` |

## 5. Form-level validation (`validateBankDetailsForm`)

| Rules key | Required | Plus |
|---|---|---|
| `nre_pis` (step 1 Next) | IFSC, account no, account type, RBI ref no, RBI date | primary validated |
| `nren_pis` (NRE PIS Submit = secondary) | same for secondary | secondary validated |
| `nre_nonpis` | IFSC, account no, account type | validated |
| `nro_pis` / `nron_pis` | as NRE PIS | validated |
| `nro_nonpis` | IFSC, account no, account type | validated |

## 6. Final submit → `POST /Onboarding/BankDetail/SavebankDetails`

`multipart/form-data` (MVC indexed binding):

```
EmployeeCode=<empId>
employeeformno=<formNo>
FormEntryID=<skrefno>
employeePanNo=<PAN>
BankDetails[0].NriType=NREPIS        BankDetails[0].BankBranchID=…  BankDetails[0].IfscCode=…
BankDetails[0].AccountNumber=…       BankDetails[0].AccountType=0   BankDetails[0].IsDefault=1
BankDetails[0].RBIReferenceNumber=…  BankDetails[0].RBIApprovalDate=yyyy-MM-dd
BankDetails[0].ChequeLeafUploadFlag=Y BankDetails[0].ChequeLeafUploadPath=<formNo>_<PAN>/CHEQUELEAF_….jpg
BankDetails[0].MicrCode=  BankDetails[0].TransactionReferenceNumber=  BankDetails[0].UpiID=
BankDetails[1].NriType=NRENPIS   (NRE SB secondary)
…  NRENONPIS / NROPIS / NRONPIS (NRO SB) / NRONONPIS
```

`NriType` codes: `NREPIS`, `NRENPIS` (NRE SB), `NRENONPIS`, `NROPIS`, `NRONPIS` (NRO SB), `NRONONPIS`.

**After save:** `message === "Success"` → "All bank details saved successfully!" → `formsucess` (or `objectionforminward` in objection mode).

## 7. Objection mode

`BankDetail/getbankdeytailsonformid "<skrefno>"` → each saved account is mapped back by `NriType` into its block (IFSC looked up again via `GetIfscList` to fill the bank / branch names), the bank letter link is restored, the blocks are marked validated, and the cards are marked completed.

## 8. Known issues

1. `#savebtnnrenonpis` and `#savebtnnrnonopis` have a second click handler that calls the undefined `validateNriTypeForm`, which throws a console error.
2. The per-account "Bank Letter" inputs are hidden. One common letter is used for all accounts.
3. The `NriType` sent to `CheckBank` is the UI key (`nre_pis`), but the server overrides it with `""`.
4. Only Savings can be selected as the account type.
5. The NRO-NON-PIS section reuses the id `inputbankupload` (duplicate id with the common upload).

## 9. React migration notes

* Config-driven: `bankTypes = [{ key:'NRE_PIS', flag:'Nre_Pis', accounts:['primary','sb'] }, …]`.
* `<BankAccountBlock role="primary|sb" alwaysDefault? requireRbi? />` with an `useIfscSearch()` hook and a `useCheckBank()` mutation.
* State per account `{ ifsc, branchId, bankName, branchName, accountNo, accountType, rbiRef, rbiDate, isDefault, validated }`. "Completed" = all accounts of a type validated.
* One `<FileUpload>` for the bank letter, required before editing.
