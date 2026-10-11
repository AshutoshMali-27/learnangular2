# In-process Forms (`NRIAccountOpening/InprocessAccountDetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/InprocessAccountDetails` (menu: Account Opening → **Inprocess Forms**) |
| View | `Views/NRIAccountOpening/InprocessAccountDetails.cshtml` |
| Script | `wwwroot/pages/inprocessaccount.js` (+ DataTables) |

## Purpose

Lists applications that were started but **not completed** (account-opening status = 1), so the user can resume them at the next pending stage.

## Controls

| Label | Id | Notes |
|---|---|---|
| Export to Excel | `btnExportExcel` | Downloads the visible table as `Inprocess_summary<timestamp>.xls` (HTML table re-encoded as Excel) |
| Add new account | `btnaddaccount` | → `/Onboarding/nriaccountopening2/forminward` |
| Form No / PAN No / Mobile No / Email Id | `txtformno`, `txtpanno`, `txtmobileno`, `txtemailid` | text filters |
| From Date / To Date | `txtfromDate`, `txttoDate` | date ≤ today, picker only |
| Search | `btnclick` | |
| Reset | `btnReset` | Searches with empty filters but **does not clear the input boxes** |

Loads automatically on page open.

## API

`POST /Onboarding/NRIAccountOpening/GetInprocessNRIReportDetails` (`NRIReportRequest`; the server forces `accountOpeningStatus = "1"`) → array of `NRIClient`.

## Grid (`#nriinprocessReportTable`)

| Column | Field |
|---|---|
| PAN No | `PanNo` |
| Form No | `FormNo` |
| Email | `EmailId` |
| NRI Type | `NRI_TYPE` |
| Mobile No | `MobileNo` |
| Product Name | `PRODUCT_NAME` |
| Name As Per PAN | `NameAsPerPan` |
| Reference No | `SkReferenceNo` |
| Action | Button showing `Account_Status` (or "INPROCESS") → `/Onboarding/nriaccountopening2/forminward?stageId=<stage_id+1>&skrefno=&formNo=` (opens the stage tracker on that form) |

The script also contains an unused `stageMap` with wrong page names (`addredddetails`, …). Navigation always goes to the tracker.

## React migration notes

Same list component as the other reports. The action opens `/onboarding/journey/:formNo`.
