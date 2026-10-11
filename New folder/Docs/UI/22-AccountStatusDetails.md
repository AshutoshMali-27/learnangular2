# Account Status Report – Search (`NRIAccountOpening/AccountStatusDetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/AccountStatusDetails` (menu: Reports → **Account Status Report**) |
| View | `Views/NRIAccountOpening/AccountStatusDetails.cshtml` ("Account Status Report") |
| Script | `wwwroot/pages/accountstatusdetails.js` (+ DataTables) |

## Purpose

Searches accounts by many identifiers and shows their form / account status. Clicking a form number, customer id or S2K id opens the detailed in-depth report ([23-AccountStatusReport.md](23-AccountStatusReport.md)).

## Filters (15 inputs + 2 buttons)

| Label | Id | Type | Request key |
|---|---|---|---|
| Customer ID | `txtcustomerid` | text | `customerId` |
| S2KID | `txts2kid` | text | `s2kId` |
| DP Client ID | `txtdpclientid` | text | `dpClientId` |
| Form Number | `txtformnumber` | text | `formNumber` |
| Login ID | `txtloginid` | text | `loginId` |
| Mobile | `txtmobile` | text | `mobileNo` |
| PAN No | `txtpanno` | text | `panNo` |
| Email ID | `txtemailid` | text | `emailId` |
| Form Status | `ddlformstatus` | select – loaded from `getFormStatus` (master 52: `FORM_STATUS_ID`, `FORM_STATUS`), default `0` | `formStatusId` |
| Account Status | `ddlaccountstatus` | select: Active / Inactive / Suspended | **not sent** |
| Form Rec Date From / To | `txtformrecdatefrom`, `txtformrecdateto` | date | `formRecDateFrom`, `formRecDateTo` |
| Branch Name | `txtbranchname` | text | `branchId` (server ignores it and uses the session branch) |
| Account Open Date From / To | `txtaccountopendate`, `txtaccountopendateto` | date | `accountOpenedFromDt`, `accountOpenetToDt` |
| Search | `btnclick` | button | |
| Reset | `btnReset` | button | Clears everything, hides the grid |

**Validation (only when a Form Status is selected):** at least one date range (form-received **or** account-open) is required, both ends of a used range must be filled, and From ≤ To.

No search runs on page load (only the Form Status master loads).

## API

`POST /Onboarding/NRIAccountOpening/getaccountstatusreportsearch` (`SearchRequest`, server sets `Mode = "SEARCH"`) → array of `SearchData`.

## Grid (`#nriReportTable`) + record count (`#countText`)

Sr. No • **Form Number** (link) • **Customer ID** (link) • Login ID • Client Name • **S2K ID** (link) • Branch Name • Branch Code • Lead ID • PAN No • Form Status • Account Status • Lock Remarks • Account Open Date • Update Date • NRI Type • Branch ID • Account Type • Products.

Links → `/Onboarding/NRIAccountOpening/AccountStatusreport?formNo=<FORM_NUMBER>&custId=<CustomerID>`. The Form Number link only appears when the row has a customer id or S2K id.

## React migration notes

A large filter form (collapsible), a server-side query, and links to `/reports/account-status/:custId?formNo=`. Remove the unused Account Status filter or wire it to the API.
