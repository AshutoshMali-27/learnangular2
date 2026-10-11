# Common Layout, Shared Scripts and Conventions

## 1. Layouts

| Layout | Used by | Notes |
|---|---|---|
| `Views/Shared/onboardingloayout.cshtml` | Every employee screen (dashboard, wizard stages, lists, reports) | App shell described below |
| `Views/Shared/_Layout.cshtml` | Default (`_ViewStart`) – only views without an explicit layout (Error pages) | Older shell, also loads `layoutpage.js` |
| none (`Layout = null`) | `Auth/Login`, `nriaccountopening2/capturedetails`, `Email/verify` | Standalone pages |

## 2. App shell (`onboardingloayout`)

Session values used: `empname` and `branchTypeCode` (user chip), `empId`.

| Area | Elements | Behaviour |
|---|---|---|
| Anti-forgery | `@Html.AntiForgeryToken()` → hidden `__RequestVerificationToken` | Every AJAX call reads it and sends header `RequestVerificationToken` |
| Loader | `#loader-wrapper` "Processing..." | Shown / hidden by page scripts around AJAX calls |
| Sidebar `#sidebar` | Menu below | Collapsed by default, expands on hover (desktop). The ☰ button pins it (saved as `localStorage.sidebarPinned`). On mobile it toggles a slide-in |
| Top bar | Logo, dark-mode toggle `#darkModeToggle`, theme picker `#themeSelectorBtn` (19 colour themes), **Logout** `#btnlogout`, user chip (employee name + branch type) | |
| Content | `@RenderBody()` + footer "Copyright © 2026 … {instance text}" | |
| Mobile bottom nav | Dashboard, New Form, Menu (sheet with 8 shortcuts), Theme, Profile (sheet with Logout) | Hides while scrolling down; Esc closes the sheets |

### Sidebar menu → routes

| Menu | Item | Route |
|---|---|---|
| Dashboard | – | `/Onboarding/Home/Index` |
| Account Opening | Add New Account | `/Onboarding/nriaccountopening2/forminward` |
| | Data Objection | `/Onboarding/NRIAccountOpening/ObjectionForms` |
| | PDF Upload | `/Onboarding/NRIAccountOpening/pdfuploadformdetails` |
| | Inprocess Forms | `/Onboarding/NRIAccountOpening/InprocessAccountDetails` |
| | Allocated Forms | `/Onboarding/Home/generateform` |
| | Send Liveliness Link | `/Onboarding/NRIAccountOpening/sendnotificationforliveproof` |
| Reports | MIS Reports | `/Onboarding/NRIAccountOpening/AccountDetails` |
| | Account Status Report | `/Onboarding/NRIAccountOpening/AccountStatusDetails` |
| Courier | Courier Details | `/Onboarding/NRIAccountOpening/Courier` |

The active menu item is highlighted by matching `location.pathname`.

### Logout

Confirm dialog "Logout Confirmation" → `POST /Onboarding/Auth/Logout` (anti-forgery header) → "Logged Out" → `/Onboarding/Auth/Login`.

## 3. Shared scripts

| File | Purpose |
|---|---|
| `pages/layoutpage.js` | Sidebar, logout, active menu, bottom nav / sheets |
| `pages/thememanager.js` | `ThemeManager.init/bindEvents/setTheme/toggleMode`. Keys `localStorage['app-color-theme']` and `['app-mode']` (light / dark). Applies `data-theme` / `data-mode` attributes |
| `pages/validations.js` | `Validation.*` helpers (below) |
| `pages/sweetalertinit.js` | `swal(title, text, icon)` wrapper (not referenced by views) |
| Libraries | jQuery 4, Bootstrap 5.3, DataTables, SweetAlert2, Select2, Cropper.js (upload pages) |

### `Validation` helpers (`validations.js`)

| Function | Rule |
|---|---|
| `validatePAN` | 10 chars, `^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$` (individual PAN, 4th char **P**), not all identical characters |
| `validateEmail` | Standard regex, and the domains `sharekhan.com` and `miraeassetcm.com` are **blocked** |
| `validateMobile` | Digits only |
| `validatePincode` | `^[1-9][0-9]{5}$` |
| `validateAadhaar` | 12 digits |
| `validatePassport` | `^[A-Z][0-9]{7}$` |
| `validateVoterID` | `^[A-Z]{3}[0-9]{7}$` |
| `validateDrivingLicense` | `^[A-Z]{2}\d{2}\s?\d{11}$` |
| `validateIFSC` | `^[A-Z]{4}0[A-Z0-9]{6}$` |
| `validateAccountNo` | 9–18 digits |
| `validateTAN`, `validatePassword` | TAN format; 8+ chars with upper, lower, digit and special |

## 4. Stage page conventions (all wizard stages)

Every `nriaccountopening2/*` stage page follows the same pattern, so the React version should implement these once:

1. **Hidden context** rendered by the server: `lblformno` / `txtformNo` (form number), `lblskrefno` (SK reference no = FormEntryID), `lblemployeeid` (empId), `lblbranchid` (branchId), plus objection inputs `remarks`, `objections` (JSON), `objectionCount`, `stepId`, `stepName`.
2. **Progress lookup**: `NRIAccountOpening/GetInProcessData {formNumber}` to get the client PAN, holder count, NRI types, bank flag, etc.
3. **Internal stepper**: `.step[data-step]` panels, `#prevBtn` / `#nextBtn` / `#saveBtn`, `#progressBar`, and a `stepValidationRules` table checked on Next.
4. **Validated fields**: a "Validate" button calls a server check, turns green and locks the field. "Reset" unlocks it.
5. **Cascading masters**: Country → State → City through `getStatemaster` / `getCitymaster`. Non-India country ⇒ pincode `111111`.
6. **File uploads**: images go through a Cropper.js modal (zoom, rotate, crop → JPEG 0.9); files are saved to `{networkFolder}/{formNo}_{PAN}/…`; the returned relative path is stored and later sent in the save payload; "View" opens it through a `GetDocument` blob.
7. **Objection mode** (`objectionCount > 0`): banner `#objectionWarningBanner` + modal listing remarks and objections, pre-fill from the server, and after save redirect to `objectionforminward`.
8. **After save**: SweetAlert success → redirect to `forminward?formNo=&skrefno=` (the tracker), which then enables the next stage.

## 5. Suggested React architecture

```
src/
  app/            AppShell (sidebar, topbar, bottom-nav), auth guard, theme provider
  api/            axios client (anti-forgery header / bearer), one module per controller (see Docs/API)
  components/     VerifiableField, AddressForm, CascadingLocation, FileUpload(+crop), Stepper,
                  ObjectionBanner, DataGrid, SearchFilters, YesNo, OtpInput
  features/
    journey/      JourneyTracker, stages/{Inward,Address,Holder,Fatca,Proof,Nominee,Misc,
                  Family,ExtraDetails,Brokerage,Bank}, JourneyComplete
    objections/   ObjectionForms list, ObjectionHub
    reports/      MIS, Inprocess, AccountStatus search + detail
    pdf/, liveliness/, courier/, allocated-forms/, dashboard/, auth/
  validation/     zod schemas per stage (port of stepValidationRules + Validation.*)
```

Keep journey context `{ formNo, skRefNo, pan, holderCount, nriTypes, isBankAvailable, objection }` in a store (Zustand / Redux / React context) instead of hidden labels and query strings.
