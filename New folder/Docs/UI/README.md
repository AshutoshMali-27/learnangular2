# OneKYC NRI Onboarding – UI / Screen Documentation (for the MVC → React migration)

These documents describe **every Razor view and its page script**: what the screen does, every input (id, type, validation, default), how the inputs depend on each other, which APIs are called and with what payload, and where the user goes next. Each document ends with known issues and React migration notes.

Server-side API details are in [`../API`](../API/README.md).

## Start here

* [00-Common-Layout.md](00-Common-Layout.md) – app shell, menu, theme, shared validation helpers, **conventions shared by all stage pages**, suggested React structure.
* [00-FormInward-StageTracker.md](00-FormInward-StageTracker.md) – the journey hub that links all stages.

## Account-opening journey (wizard stages)

```
Allocated Forms (generate form no)
        │
Add New Account ─► Stage tracker (enter / validate form no)
        │
 1 Inward ─► 2 Address ─► 3 Holder ─► 4 FATCA ─► 5 Proof ─► 6 Nominee ─► 7 Misc
        ─► (8 Family – disabled) ─► 9 Extra Details (Is bank available?)
        ─► 10 Brokerage ─┬─ bank = N ─► Form Success
                         └─ bank = Y ─► 11 Bank Details ─► Form Success
(after every stage save → back to the tracker, which unlocks the next stage)
```

| # | Screen | Doc | Main inputs | Saves via |
|---|---|---|---|---|
| – | Stage tracker | [00-FormInward-StageTracker.md](00-FormInward-StageTracker.md) | Form number | – |
| 1 | Inward | [01-Inward.md](01-Inward.md) | ~55 (PAN, personal, product, DP, contact, branch) | `NRIAccountOpening/SaveFormDetails` |
| 2 | Address | [02-Address.md](02-Address.md) | 20 | `NRIAccountOpening/SaveAddress` |
| 3 | Holder | [03-Holder.md](03-Holder.md) | ~55 per holder (max 2) | `Holder/SaveHolders` |
| 4 | FATCA | [04-Fatca.md](04-Fatca.md) | ~55 per holder | `Fatca/SaveFatcaData` |
| 5 | Proof | [05-Proof.md](05-Proof.md) | 11 per document | `Proof/SaveProofDetails` |
| 6 | Nominee | [06-Nominee.md](06-Nominee.md) | 22 (+20 guardian) per nominee | `Nominee/SavenomineeData` |
| 7 | Miscellaneous | [07-Miscellaneous.md](07-Miscellaneous.md) | 16 consents | `Miscellaneous/SavemiscDetails` |
| 8 | Family Details (disabled) | [08-FamilyDetails.md](08-FamilyDetails.md) | 29 | `OtherDetails/SaveFamilyDetails` |
| 9 | Extra Details / IPV | [09-ExtraDetails.md](09-ExtraDetails.md) | ~37 | `ExtraDetails/SaveExtraDetails` |
| 10 | Brokerage | [10-Brokerage.md](10-Brokerage.md) | 1 (scheme) | `Brokerage/SaveBrokerage` |
| 11 | Bank Details | [11-BankDetails.md](11-BankDetails.md) | ~11 per account, up to 6 accounts | `BankDetail/SavebankDetails` |
| – | Form Success | [12-FormSuccess.md](12-FormSuccess.md) | – | – |

## Objections, post-submission and reports

| Screen | Doc | Purpose |
|---|---|---|
| Objection correction hub | [13-ObjectionFormInward.md](13-ObjectionFormInward.md) | Stages with objections → fix → close objections |
| Data Objection list | [15-ObjectionForms.md](15-ObjectionForms.md) | Forms with objections |
| In-process forms | [16-InprocessAccountDetails.md](16-InprocessAccountDetails.md) | Resume incomplete forms |
| MIS report | [17-AccountDetails-MIS.md](17-AccountDetails-MIS.md) | All forms, export |
| PDF Upload | [18-PdfUpload.md](18-PdfUpload.md) | Upload signed / bank PDFs, resend |
| Send Liveliness Link | [19-SendLivelinessNotification.md](19-SendLivelinessNotification.md) | Email verification / liveliness emails |
| Customer liveliness page | [20-CaptureDetails-Liveliness.md](20-CaptureDetails-Liveliness.md) | Public face-scan page (AiNxt SDK) |
| Courier | [21-Courier.md](21-Courier.md) | Client→branch / branch→HO AWB tracking |
| Account Status search | [22-AccountStatusDetails.md](22-AccountStatusDetails.md) | Multi-field account search |
| Account Status in-depth | [23-AccountStatusReport.md](23-AccountStatusReport.md) | Read-only 360° view (tabs) |

## Other screens

| Screen | Doc |
|---|---|
| Dashboard | [24-Dashboard.md](24-Dashboard.md) |
| Allocated Forms / Generate form number | [25-AllocatedForms-GenerateForm.md](25-AllocatedForms-GenerateForm.md) |
| Login + OTP | [26-Login.md](26-Login.md) |
| Email verification result, error pages, missing views | [27-EmailVerify-and-ErrorPages.md](27-EmailVerify-and-ErrorPages.md) |

## Cross-cutting findings to address during migration

1. **State lives in the DOM**: hidden labels, global `isValid…` flags and query strings carry the journey context. Move it to a store.
2. **Master data loading** relies on `setTimeout` / polling (`setDropdownValue`, a 5-second DP delay). Use data-fetching hooks.
3. **Server validation buttons** (PAN, email, mobile, codes, TIN, bank) follow one pattern → a single `VerifiableField` component.
4. **Copy-paste divergence**: the same logic (address, cropper upload, objection banner, master loaders) is duplicated per page, with drifting rules (address 50 vs 70 chars, NegativeListCheck v1 vs v2).
5. **No pre-fill outside objection mode** for several stages (Misc, Brokerage, Family). Re-opening a stage starts blank.
6. **Security**: client-side-only captcha, a fake OTP resend, the liveliness API key exposed in the browser, a hard-coded email recipient (ExtraDetails), unescaped HTML in cards.
7. **Case-sensitive asset path**: `formsucess.js` vs `formSucess.js`.
8. **Unused / dead code**: `otherdetails.js`, `sweetalertinit.js`, the AMC / KRA sections, hidden Inward fields, Family stage.
