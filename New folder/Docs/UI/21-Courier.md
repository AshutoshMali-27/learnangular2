# Courier Details (`NRIAccountOpening/Courier`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/Courier` (menu: Courier → **Courier Details**) |
| View | `Views/NRIAccountOpening/Courier.cshtml` |
| Script | `wwwroot/pages/courier.js` (+ DataTables) |

## Purpose

Tracks the **physical movement of signed application forms**:

* **client to branch** – forms the client has couriered to the branch. The user marks them as received.
* **branch to ho** – forms the branch sends on to Head Office. The user records the AWB.

## Controls

| Label | Id | Type | Notes |
|---|---|---|---|
| Export to Excel | `btnExportExcel` | button | Bug: exports `#nriReportTable`, which does not exist on this page |
| Add new account | `btnaddaccount` | button | Bug: navigates to the JSON endpoint `NRIAccountOpening/GetCuriorDetails` |
| Form No / PAN No / Mobile No / Email Id | `txtformno`, `txtpanno`, `txtmobileno`, `txtemailid` | text | filters |
| From Date / To Date | `txtfromDate`, `txttoDate` | date | |
| Courier status | `ddlcuroirstatus` | select: `client to branch`, `branch to ho` | Decides the list and the save action |
| Search / Reset | `btnclick`, `btnReset` | buttons | Reset clears filters, sets status to "client to branch" and searches |

**AWB modal** (`#awbModal`, static backdrop):

| Field | Id | Req |
|---|---|---|
| Form No | `txtModalFormNo` (read-only) + hidden `hdnFormNo` | – |
| (hidden) courier type | `hdnCourierType` = current status filter | – |
| AWB No | `txtAwbNo` max 50 | ✔ |
| Remark | `txtRemark` textarea max 250 | – |
| Cancel / Save | `btnSaveAwb` | |

## API

| Action | Endpoint | Body |
|---|---|---|
| List (on load and Search) | `POST NRIAccountOpening/GetCuriorDetails` | `{ FormNumber, PANNumber, MobileNumber, EmailID, FromDate, ToDate, BranchID:"" (server uses session), CourierType }` |
| Save AWB | `POST NRIAccountOpening/SaveCourierDetails` | `{ FormNumber, AWBNumber, Remark, CourierType }` → server calls `ClientCourierRecieved` or `CourierSentToHO` |

## Grid (`#nriCouriortable`)

PAN No `PANNumber` • Form No `FormNumber` • Email `EmailID` • NRI Type `NRI_TYPE` • Mobile No `MobileNumber` • Branch Name `BranchName` • Product Name `Products` • Name As Per PAN `ClientName` • Reference No `SkReferenceNo` • Form Punch Date `FormPunchDate` • Action **View** → opens the AWB modal for that form.

On save success: the modal closes, the list reloads, and the message is "Courier marked as received" (client → branch) or "Courier Sent to HO".

## React migration notes

Tabs or a segmented control for the courier status, a grid, and a small dialog form. Remove or fix the broken Export / Add buttons.
