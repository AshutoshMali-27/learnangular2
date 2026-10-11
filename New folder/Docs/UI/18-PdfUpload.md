# PDF Upload (`NRIAccountOpening/pdfuploadformdetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/pdfuploadformdetails` (menu: Account Opening → **PDF Upload**) |
| View | `Views/NRIAccountOpening/pdfuploadformdetails.cshtml` ("PDF Upload") |
| Script | `wwwroot/pages/pdfuploadformdetails.js` (+ DataTables) |

## Purpose

After a form is completed, the system generates a KYC / account-opening PDF that the client signs. This screen lists forms awaiting a **signed PDF**, lets the user upload it (or the PDF with bank details), view objections against the PDF, and **resend** the generated PDF to the client.

## Filters

Form No `txtformno`, PAN No `txtpanno`, Mobile No `txtmobileno`, Email Id `txtemailid`, From / To Date `txtfromDate` / `txttoDate` (≤ today, picker only), **Search** `btnclick`, **Reset** `btnReset` (clears and searches). Loads automatically.

## API (list)

`POST /Onboarding/NRIAccountOpening/GetFormDetailsForPDFUpload` (`NRIReportRequest`; the server adds the session branch) → `{ Message, Data: [pdfdata], Description }`.

## Grid (`#nriobjectionreportTable`, scrollX, sorted by Cooldown)

| Column | Field / rendering |
|---|---|
| PAN No | `PANNumber` |
| Form No | `FormNumber` |
| Client Name | `ClientName` (truncated with a tooltip) |
| PDF Type | `PDFType` badge: `Signed KYC PDF` or `PDF With Bank Details` |
| Email | `EmailID` |
| Cooldown | `PDFCooldownTimeLeft`: "-" when 0 / empty, else a clock badge with the remaining time |
| Status | `Objection.Objections` null → "No Objection", else "Objection" |
| Action | **Upload** (hidden PDF file input) • **View** (only when there are objections) • **Resend** (only when PDF Type = Signed KYC PDF **and** there are objections **and** the cooldown is 0) |

## Actions

| Action | Behaviour / API |
|---|---|
| Upload | Must be `application/pdf`. `multipart/form-data` (`file`, `formNumber`, `panNo`, `skReferenceNo`) to:<br>• `NRIAccountOpening/UploadSignedPDF` (default)<br>• `NRIAccountOpening/UploadPDFWithBankDetails` when PDF Type = "PDF With Bank Details"<br>→ `message === "Success"` → "PDF uploaded successfully!" and the list reloads |
| View | Opens `#objectionModal` "Objections – Form No: X" with numbered objection texts and the remark |
| Resend | Confirm "Resend PDF" → `POST NRIAccountOpening/ResendPDF { FormEntryID: skrefno, EmployeeID: "" }` (the server uses the session employee) → "PDF resent successfully!" |

## React migration notes

Row actions as a small `<PdfRowActions row />` component. The Resend visibility rule (`isSignedKyc && hasObjection && cooldown == 0`) and the upload endpoint choice (by `PDFType`) should live in pure helpers.
