# Data Objection List (`NRIAccountOpening/ObjectionForms`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/ObjectionForms` (menu: Account Opening → **Data Objection**) |
| View | `Views/NRIAccountOpening/ObjectionForms.cshtml` ("Objection Forms") |
| Script | `wwwroot/pages/objectionform.js` (+ DataTables) |

## Purpose

Lists the branch's forms that the back office has **objected to**, so the user can open one and correct it.

## Filters (6 inputs + 2 buttons)

| Label | Id | Type | Sent as |
|---|---|---|---|
| Form No | `txtformno` | text | `formNumber` |
| PAN No | `txtpanno` | text | `panNo` |
| Mobile No | `txtmobileno` | tel | `mobileNumber` |
| Email Id | `txtemailid` | email | `emailId` |
| Objection From Date | `txtfromDate` | date ≤ today (picker only) | `requestpunched_fromDate` |
| Objection To Date | `txttoDate` | date ≤ today | `requestpunched_toDate` |
| Search | `btnclick` | button | runs the search |
| Reset | `btnReset` | button | clears filters and searches again |

The search also runs automatically on page load with empty filters.

## API

`POST /Onboarding/NRIAccountOpening/GetobjectionNRIReportDetails` with an `NRIReportRequest` body (the server adds the session `BranchID`) → `{ Message, Data: [...], Description }`.

## Results grid (`#nriobjectionreportTable`, DataTables, 10 per page, searchable, sorted by Form Punch Date desc)

| Column | Field |
|---|---|
| PAN No | `PANNumber` |
| Form No | `FormNumber` |
| NRI Type | `NRI_TYPE` |
| Product Name | `Products` |
| Name As Per PAN | `ClientName` |
| Reference No | `SkReferenceNo` |
| Form Punch Date | `FormPunchDate` |
| Email | `EmailID` |
| Mobile No | `MobileNumber` |
| Action | **Check Objection** button → `/Onboarding/nriaccountopening2/objectionforminward?skrefno=&formNo=` ([13-ObjectionFormInward.md](13-ObjectionFormInward.md)) |

States: `#loadingState` while loading, `#emptyState` ("No Results Found") when there are no rows, SweetAlert on error.

## React migration notes

`<SearchFilters>` + `<DataGrid>` (TanStack Table / MUI DataGrid) with a server query hook. Reuse the same filter component for the In-process and MIS list screens.
