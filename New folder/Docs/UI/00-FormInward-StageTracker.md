# Stage Tracker / Journey Hub (`forminward`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/forminward?formNo=&skrefno=&stageId=` |
| Controller action | `nriaccountopening2Controller.forminward` |
| View | `Views/nriaccountopening2/forminward.cshtml` |
| Script | `wwwroot/pages/forminward2.js` |
| CSS | `onboarding.css`, `commonjourney.css`, `forminward.css` |
| Menu entry | "Account Opening → Add New Account" and bottom-nav "New Form" |

## 1. Purpose

Entry point of the NRI account-opening journey and the **hub every stage returns to after saving**. It:

1. asks for a **Form Number** when none is known and validates it;
2. fetches how far the form has progressed (`Stage_id`) and renders a 10-step tracker;
3. lets the user open **only the current (next pending) stage** – completed and future stages are disabled.

## 2. Server values (hidden `<p>`)

| Id | Source |
|---|---|
| `lblstageid` | `ViewBag.stageId` (query `stageId` + 1) – not used by JS |
| `lblviewdetails` | `ViewBag.viewdetail` – not used by JS |
| `lblskrefno` | `ViewBag.skrefno` |
| `lblformno` | `ViewBag.formNo` |

## 3. Two display states

| State | Condition | Visible block |
|---|---|---|
| A – Ask form number | both `formNo` and `skrefno` empty | `#isformandskrefnotexist` |
| B – Tracker | `formNo` or `skrefno` present (from query string or after successful validation) | `#isformandskrefexist` |

## 4. Inputs (state A)

| # | Label | Id | Control | Behaviour |
|---|---|---|---|---|
| 1 | Enter Form Number | `txtformNo` | text, required | Typing enables **Submit** |
| 2 | Submit | `btnvalidateform` | button | Calls `CheckFormNo` |
| 3 | Reset | `btnResetForm` | button | Clears input, back to state A |

**Submit flow** – `POST /Onboarding/NRIAccountOpening/CheckFormNo` (form `formNumber`) → `{ isValid, state, SkReferenceNo, Description, ... }`:

| Response | Action |
|---|---|
| `isValid` and `state == "1"` and `SkReferenceNo != ""` | Existing in-process form: `skrefno = SkReferenceNo`, load progress |
| `isValid` and `SkReferenceNo == "0"` | New (allocated, unused) form: `skrefno = ""`, load progress (→ stage 1) |
| `isValid` | Switch to state B, lock input, button turns green |
| not valid | Error popup with `Description`, input locked (must Reset) |

## 5. Tracker (state B)

Progress loaded by `POST /Onboarding/NRIAccountOpening/GetInProcessData` (JSON `{ formNumber }`) → `data[0]` = `{ Stage_id, Is_Bank_Available, HolderType[], ... }`.

* `stageId = Stage_id + 1` = next stage to complete. If no data → `stageId = 1`.
* Progress bar: `Step {Stage_id} of 10`, `percent = Stage_id/10`.

| Button | Step marker | Title | Navigates to |
|---|---|---|---|
| `step_1` | 1 | Inward | `inward` |
| `step_2` | 2 | Address Details | `address` |
| `step_3` | 3 | Holder | `holder` |
| `step_4` | 4 | FATCA | `fatca` |
| `step_5` | 5 | Proof | `proof` |
| `step_6` | 6 | Nominee | `nominee` |
| `step_7` | 7 | Misc | `miscellaneous` |
| `step_8` | – | Family Detail | **hidden**, stage 8 skipped (if `stageId == 8` it is bumped to 9) |
| `step_9` | 8 | Extra Detail | `extradetailspage` |
| `step_10` | 9 | Brokerage | `brokerage` |
| `step_11` | 10 | Bank Detail | `bankdetails` |

All navigate as `/Onboarding/nriaccountopening2/{page}?formNo=&stageId=&skrefno=` with `stageId` = the computed next stage.

Step state rules (`updateStepsByStage`):

| Condition | Class | Status text | Clickable |
|---|---|---|---|
| step < stageId | `step-completed` | Completed | no |
| step == stageId | `step-active` | In Progress | **yes** |
| step > stageId | `step-pending` | Pending | no |
| stageId == 11 and `Is_Bank_Available == "N"` | bank step forced pending | Pending | no |

So the journey is strictly sequential; the server-side `nriaccountopening2` actions also redirect back here if someone opens a stage out of order (see API doc).

## 6. Overall journey (normal flow)

```
forminward (enter form no) ─► inward (1) ─► forminward ─► address (2) ─► forminward ─► holder (3)
   ─► fatca (4) ─► proof (5) ─► nominee (6) ─► miscellaneous (7) ─► [familydetails (8) – disabled]
   ─► extradetailspage (9) ─► brokerage (10) ─► bankdetails (11, only if bank available) ─► formsucess
```

## 7. React migration notes

* Route `/onboarding/journey/:formNo?` with a `useJourneyProgress(formNo)` hook (`GetInProcessData`).
* Stage definitions as a config array `{ id, title, path, hidden? }`, the "bank only if `Is_Bank_Available == 'Y'`" rule and the family-detail skip becoming data, not code.
* Guard stage routes on the client (redirect when `stage !== nextStage`) in addition to the server checks.
* Known bug: the Reset handler disables Submit via `if ($('#txtformNo').val(''))`, which is always truthy.
