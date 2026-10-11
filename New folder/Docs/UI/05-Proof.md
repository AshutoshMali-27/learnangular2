# Stage 5 – Proof Documents (`proof`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/proof?formNo=&stageId=&skrefno=&remarks=&objections=&objectionCount=&stepId=&stepName=` |
| Controller action | `nriaccountopening2Controller.proof` |
| View | `Views/nriaccountopening2/proof.cshtml` |
| Scripts | `validations.js`, `proof2.js` (+ Cropper.js) |
| Server APIs | [ProofController.md](../API/ProofController.md) |

## 1. Purpose

Upload and describe the **KYC proof documents** (PAN, passport, Aadhaar, address proofs, etc.) for the client and each joint holder. Each document captures type, number, validity, place of issue, which **proof categories** it satisfies (ID / address / income / signature), and the scanned file. All documents for all holders are saved in one call.

## 2. Screen layout

```
┌ Objection banner                                                     ┐
│ [Client Proof  Select] [Holder 2 Proof  Select] [Holder 3 Proof  Select]  ← #proofdetailsTypeContainer │
│ ┌ #client_proof  (card form) ─────────────────── ✕ ┐                    │
│ │                              [+ Add Document]   │                    │
│ │ #client_address_list  (document rows: type, categories, file, Edit/Delete) │
│ │                                     [Submit]    │  ← per-section "done"  │
│ └─────────────────────────────────────────────────┘                    │
│ (same for #holder1_proof / #holder2_proof)                            │
│                                        [Submit All Proof]  ← #submitAllProofContainer (hidden until all done) │
└──────────────────────────────────────────────────────────────────────┘
Modals: #docAddModal (Add/Edit document), #proofImageCropModal, #proofObjectionModal
```

| Section card | Store key | HolderType sent | Enabled when |
|---|---|---|---|
| Client Proof (`client_proof`) | `client_address` | `TRD` | always |
| Holder 2 Proof (`holder1_proof`) | `holder1_address` | `2ND` | `HolderCount ≥ 2` |
| Holder 3 Proof (`holder2_proof`) | `holder2_address` | `3RD` | `HolderCount = 3` |

Disabled cards get the class `card-disabled` and cannot be opened. Clicking a card's **Select** opens its form (only one open at a time); ✕ closes it.

## 3. Add / Edit Document modal (`#docAddModal`) – 11 controls

| # | Label | Id | Control | Req | Behaviour |
|---|---|---|---|---|---|
| 1 | Document Type | `modalDocType` | select (document master, code 18) | ✔ | Each option carries flags `havedocnumber`, `havedtofissue`, `havedtofexpiry`, `haveplaceofissue`, `isidproof`, `isaddrproof`, `isbankproof` that **show / require** the fields below and **enable** the allowed proof-category checkboxes |
| 2–6 | Proof Categories | checkboxes `modal_id_proof`, `modal_current_address`, `modal_permanent_address`, `modal_income_proof`, `modal_signature_proof` | checkbox | ≥ 1 | All disabled until a type is chosen; enabled per §4 |
| 7 | Document Number | `modalDocNumber` | text max 100 | if `havedocnumber` | Type `3` (PAN): forced uppercase, 4th char forced to `P`, regex check. Type `74` (Aadhaar): masked `XXXX-XXXX-1234` (only the last 4 digits are kept). Others: alphanumeric only |
| 8 | Valid From | `modalValidFrom` | date ≤ today, picker only | if `havedtofissue` | |
| 9 | Valid To | `modalValidTo` | date ≥ tomorrow, picker only | if `havedtofexpiry` | |
| 10 | Place | `modalPlace` | text max 100 | if `haveplaceofissue` | |
| 11 | File | `modalFileInput` + drop area `modalDropArea` | file (`.pdf .jpg .jpeg .png`, ≤ 5 MB) | ✔ | Click or drag & drop. Images open the crop editor (zoom, rotate, reset, Crop & Upload) and upload as JPEG. The file is **uploaded immediately** to `Proof/UploadFile` and a preview with "Open File" + ✕ remove is shown |

Buttons: **Cancel** (`modalBtnCancel`), **Add Document** (`modalBtnAdd`). Add validates type, number (PAN format), dates, place, ≥ 1 category and an uploaded file, then adds or updates the row in `documentStore[section]` and re-renders the list.

The visual stepper in the modal (1 Select → 2 Upload → 3 Verify) is decorative.

## 4. Proof-category enabling rules (from document-type flags)

| Type flags | Enabled categories |
|---|---|
| address + id | Current address, Permanent address, ID |
| address + bank | Current address, Permanent address, Income |
| bank + id | ID, Income |
| address only | Current address, Permanent address |
| id only | ID |
| bank only | Income |

Signature proof is never enabled by these rules.

## 5. Section rules (per-section **Submit**)

| Section | Must contain |
|---|---|
| Client | ≥ 1 document, a **PAN** (type `3`) and a **Passport** (type `5`) |
| Holder 2 | ≥ 1 document and a PAN |
| Holder 3 | ≥ 1 document and a PAN |

When a section passes, the form closes and the card shows a "✓ Completed" badge. When every enabled section is completed, **Submit All Proof** (`#submitAllProofBtn`) appears.

## 6. Page load

| Step | Call | Use |
|---|---|---|
| 1 | `NRIAccountOpening/GetInProcessData {formNumber}` | `Pan_No` (file folder), `HolderCount` → enable/disable holder cards |
| 2 | `Proof/getdocumentmaster {masterCode:"18"}` | Document-type options with flags |
| 3 (objection mode) | `Proof/GetProofDetails "<skrefno>"` | Rebuilds `documentStore` by `HolderType`, marks sections completed, shows objection banner |

## 7. Submit payload (`ProofDetailsRequest`) → `POST /Onboarding/Proof/SaveProofDetails`

```json
{
  "FormEntryID": "<skrefno>",
  "EmployeeCode": "<empId>",
  "employeeformno": "<formNo>",
  "employeePanNo": "<primary PAN>",
  "ProofDetails": [{
    "FormEntryID": "<skrefno>", "EmployeeCode": "<empId>",
    "HolderType": "TRD",
    "ProofTypeID": "3", "ProofDocTypeName": "PAN Card", "ProofNumber": "ABCPE1234F",
    "DateOfIssue": "01/01/2020", "DateOfExpiry": "", "PlaceOfIssue": "",
    "ProofPath": "NRI000123_ABCPE1234F/proof_....pdf",
    "IsIdentityProof": "Y", "IsAddressProof": "N",
    "IsCorrespondenceAddressProof": "N", "IsPermanentAddressProof": "N",
    "IsIncomeProof": "N", "IsSignatureProof": "N",
    "IsDirectorProof": "N", "IsIntroducerProof": "N", "IsProofVerified": "N", "IsNoTradingProof": "N"
  }]
}
```

Dates are converted from `yyyy-MM-dd` to `dd/MM/yyyy`. `IsAddressProof = Y` when either address category is ticked.

**After save:** `message === "Success"` → "All proof details saved successfully!" → `forminward` / `objectionforminward`.

## 8. Other API calls

| Action | Endpoint |
|---|---|
| Upload file | `POST /Onboarding/Proof/UploadFile` (`proofFile`, `formno`, `panno`) → `{ success, fileName, filePath, fileSize }` |
| Open file | `GET /Onboarding/Proof/GetDocument?path=&formNo=&panNo=` (blob → new tab) |

## 9. Known issues

1. `showDocument(name, filePath)` is called with two arguments but defined as `showDocument(filePath)`, so the server receives the **file name**. That only works because the server applies `Path.GetFileName`.
2. Deleting a document row does not delete the uploaded file on the server.
3. The upload progress bar is simulated (random increments).
4. Signature-proof checkbox can never be enabled.
5. `initializeDocumentDropdowns` targets three ids (`ddldoctypeforclient`, …) that no longer exist; only the modal drop-down is used.

## 10. React migration notes

* State: `documents: Record<'TRD'|'2ND'|'3RD', ProofDoc[]>`, `completed: Record<...>`.
* `<ProofSection holderType>` with `<DocumentList>` and `<DocumentDialog>`. The dialog derives visible / required fields and allowed categories from the selected document type's flags (a pure function `rulesFor(docType)`).
* Shared `<FileUpload accept maxSize crop onUploaded />` (also used by FATCA, nominee and bank).
* Per-holder rules (PAN mandatory, passport mandatory for the client) as a schema validated before the final submit.
