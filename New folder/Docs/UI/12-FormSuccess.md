# Journey Complete – Form Success (`formsucess`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/formsucess?formNo=&skrefno=` |
| Controller action | `nriaccountopening2Controller.formsucess` |
| View | `Views/nriaccountopening2/formsucess.cshtml` |
| Script | `~/pages/formsucess.js` → the actual file is **`formSucess.js`** (capital S). This works on Windows / IIS (case-insensitive) but returns 404 on a case-sensitive host |
| Reached from | Brokerage save when `Is_Bank_Available = N`, or Bank Details final submit |

## Purpose

Confirmation screen shown after the last stage. It contains no inputs and makes no API calls.

## Content

| Element | Content |
|---|---|
| Heading | "Form Submitted Successfully!" – "Your NRI account opening application has been submitted successfully." |
| Form Number | `#formNumber` = `ViewBag.formNo` |
| Reference Number | `#referenceNumber` = `ViewBag.skrefno` |
| Application Status | "Application Submitted – under verification process" |
| What Happens Next? | Static list: compliance review in 2–3 business days, email notifications, possible additional documents, account details by email, track using the reference number |
| Button | **Go to Dashboard** → `/Onboarding/Home/Index` |

`formSucess.js` implements **copy-to-clipboard** for `.copy-btn[data-copy-target]` (Clipboard API with a `execCommand('copy')` fallback, icon switches to ✓ for 2 s). The copy buttons themselves are commented out in the view, so this script currently does nothing.

## React migration notes

A static `<JourneyComplete formNo skRefNo />` route. Optionally re-enable the copy buttons with `navigator.clipboard`.
