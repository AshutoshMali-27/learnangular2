# MIS Report – Account Details (`NRIAccountOpening/AccountDetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/AccountDetails` (menu: Reports → **MIS Reports**) |
| View | `Views/NRIAccountOpening/AccountDetails.cshtml` ("Account Details") |
| Script | `wwwroot/pages/accountdetails.js` (+ DataTables) |

## Purpose

MIS listing of NRI applications (all statuses) with search and Excel export.

## Controls

| Label | Id | Notes |
|---|---|---|
| Export to Excel | `btnExportExcel` | `MIS_summary<timestamp>.xls` |
| Add new account | `btnaddaccount` | → `forminward` |
| Form No / PAN No / Mobile No / Email Id | `txtformno`, `txtpanno`, `txtmobileno`, `txtemailid` | filters |
| From Date / To Date | `txtfromDate`, `txttoDate` | request-punched date range (no max-date restriction here) |
| Search | `btnclick` | |
| Reset | `btnReset` | Clears inputs only (does not re-search) |

Loads automatically with empty filters.

## API

`POST /Onboarding/NRIAccountOpening/GetNRIReportDetails` (`NRIReportRequest`, `accountOpeningStatus: ""`) → array of `NRIClient`.

## Grid (`#nriReportTable`)

| Column | Field |
|---|---|
| PAN No | `PanNo` |
| Form No | `FormNo` |
| Email | `EmailId` |
| NRI Type | `NRI_TYPE` |
| Mobile No | `MobileNo` |
| Branch Code | `BranchCode` |
| Product Name | `PRODUCT_NAME` |
| Name As Per PAN | `NameAsPerPan` |
| Reference No | `SkReferenceNo` |
| Action (status badge) | `Account_Status`: `INPROCESS` → "In Process" badge, otherwise the status text (read-only) |

Errors use `alert(response.message)`.

## React migration notes

Reuse the shared report list. Export can use SheetJS to create a real `.xlsx`.
