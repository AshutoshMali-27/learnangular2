# Dashboard (`Home/Index`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/Home/Index` (landing page after login; menu **Dashboard**) |
| View | `Views/Home/Index.cshtml` |
| Script | `wwwroot/pages/indexpage.js` |
| Guard | Redirects to Login when the session has no `empId` |

## Purpose

A work-queue overview for the branch: counts of forms in each pending state. Most tiles link to the screen where that work is done.

## Data

`POST /Onboarding/Home/GetDashboardCounts` (no body; the server uses the session branch) → `{ status, data: {...counts} }`. On failure every count shows "-".

## Tiles

| Group | Tile | Element id | Count field | Click → |
|---|---|---|---|---|
| Accounts Under Process | Pending Accounts | `divInprocessCard` / `lblinprocess` | `InprocessFormsCount` | – (no link) |
| Data Collection & Objections | Data Collection Pending | `divWaitingForDataFormsCount` | `WaitingForDataFormsCount` | In-process Forms |
| | Data Objections | `divdataobjectionforms` | `DataObjections` | Data Objection list |
| Liveliness & Verification | Liveliness Pending | `divlivelinesspending` | `LivelinessPending` | Send Liveliness Link |
| | Email Verification Pending | `divEmailVerificationPending` | `EmailVerificationPending` | Send Liveliness Link |
| PDF Upload & Objections | Signed PDF Upload | `divSignedPDFUploadPending` | `SignedPDFUploadPending` | PDF Upload |
| | Bank PDF Upload | `divbankpdfuploadpending` | `BankPDFUploadPending` | PDF Upload |
| | PDF Objections | `divpdfobjectionforms` | `PDFObjections` | PDF Upload |
| Courier Management | Pending Courier from Client | `divCourierFromClientPending` | `CourierFromClientPending` | – (no link) |
| | Courier to be sent to HO | `divCourierToBeSentToHOPending` | `CourierToBeSentToHOPending` | – (no link) |

The script also binds clicks to `#SystemAuditOkAPCard` / `#NeedReviewAPCard`, which don't exist (left over from a template). The courier tiles have no navigation; they could link to the Courier screen with the right status pre-selected.

## React migration notes

`<DashboardGroup title items=[{label, countKey, to}] />` driven by config. A single `useDashboardCounts()` query.
