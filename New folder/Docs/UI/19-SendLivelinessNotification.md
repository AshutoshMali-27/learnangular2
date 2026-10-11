# Send Liveliness Link (`NRIAccountOpening/sendnotificationforliveproof`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/sendnotificationforliveproof` (menu: Account Opening → **Send Liveliness Link**) |
| View | `Views/NRIAccountOpening/sendnotificationforliveproof.cshtml` ("Send Live Proof Notification") |
| Script | `wwwroot/pages/sendlivelinessnotification.js` (+ DataTables) |

## Purpose

Lists form holders whose **face-liveliness check is still pending**, and lets the branch user email them either:

* a **Liveness Alert**: the link to the customer liveliness page (`nriaccountopening2/capturedetails`, see [20-CaptureDetails-Liveliness.md](20-CaptureDetails-Liveliness.md)); or
* an **Email Alert**: the email-verification mail, when the primary holder's email is not yet verified (a prerequisite for the liveliness link).

## Filters

Form No, PAN No, Mobile No, Email Id, From / To Date, **Search**, **Reset** (clears and searches). Loads automatically.

## API (list)

`POST /Onboarding/NRIAccountOpening/Getrecordforsendliveproof` (`NRIReportRequest`; the server adds the session branch) → `{ Message, Data: [livelinessapiresponse] }`.

## Grid (`#nriobjectionreportTable`)

Rows are sorted client-side by Form No, then Holder Type, with a grey **group header row "Form No: X"** for each form. Column sorting is disabled.

| Column | Field |
|---|---|
| PAN No | `PANNumber` |
| Form No | `FormNumber` |
| Holder Type | `HolderType` (`TRD` / `2ND` / `3RD`) |
| Client Name | `ClientName` |
| Email | `EmailID` |
| Mail Last send on | `MailLastSentOn` |
| Email Verified | "Verified" when holder is `2ND`/`3RD` **or** `IsEmailOTPVerified = Y`, else "Not Verified" |
| Notification | Verified → **Liveness Alert** button (disabled / grey when `CanSendMail ≠ Y`). Not verified → **Email Alert** button |

## Actions

| Button | Confirm text | API | Success |
|---|---|---|---|
| Liveness Alert | "Are you sure you want to send the liveliness notification email?" | `POST NRIAccountOpening/SendLivelinessMail { FormEntryID: SkReferenceNo, EmployeeID: "", holderType }` | "Liveliness mail sent successfully!" + reload |
| Email Alert | "Are you sure you want to send the verification email?" | `POST NRIAccountOpening/SendVerificationMail` (form: `formNo`, `pan`, `email`) | "Verification mail sent successfully!" + reload |

## React migration notes

Grouped table (TanStack Table grouping by `FormNumber`). The button choice is a pure function of `{ holderType, isEmailOTPVerified, canSendMail }`.
