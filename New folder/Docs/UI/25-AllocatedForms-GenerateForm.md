# Allocated Forms / Generate Form (`Home/generateform`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/Home/generateform` (menu: Account Opening → **Allocated Forms**) |
| View | `Views/Home/generateform.cshtml` ("Generate Form") |
| Script | `wwwroot/pages/generateform.js` |

## Purpose

Generates a new **Form Number** for the branch (a form number is required before starting the Inward stage), and shows the branch's form numbers that are allocated but not yet used.

## Controls

| # | Label | Id | Control | Behaviour |
|---|---|---|---|---|
| 1 | Form Version | `ddlformversion` | select | Loaded from `Home/getformversionmaster` (`DOC_VER_ID` value, `DOC_VER_NAME` text). Required |
| 2 | Generate | `generateformbtn` | button | Warns "Please Select Form Version" when none is selected; otherwise `POST Home/CreateForm { documentVerId }` |
| 3 | Generated Form No | `lblformno` (in `.hidediv`, hidden until generated) | label | Shows `data.FormNumber` + "Form Number generated successfully" |
| 4 | Available Form No. | `#availableFormNumbers` in `#availableFormNumbersContainer` | list of chips | From `NRIAccountOpening/getAvalaibleformnumbers` (array of strings); the container is hidden when empty |

## Flow

```
load → getformversionmaster + getAvalaibleformnumbers
select version → Generate → CreateForm → show generated number
user copies the number → Add New Account (forminward) → enters it → Inward stage
```

The available-numbers list is not refreshed after generating.

## React migration notes

A small page: `<Select versions/>`, a generate mutation, and a chip list. Refetch the available numbers after generating, and offer "Start onboarding with this number" to deep-link into `/onboarding/journey/:formNo`.
