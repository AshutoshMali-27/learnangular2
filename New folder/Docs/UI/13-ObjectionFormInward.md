# Objection Correction Hub (`objectionforminward`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/objectionforminward?formNo=&skrefno=` |
| Controller action | `nriaccountopening2Controller.objectionforminward` |
| View | `Views/nriaccountopening2/objectionforminward.cshtml` |
| Script | `wwwroot/pages/objectionforminward.js` |
| Reached from | **Data Objection** list ([15-ObjectionForms.md](15-ObjectionForms.md)) and after saving any stage in objection mode |

## 1. Purpose

When scrutiny (back office) raises **objections** on a submitted form, the branch user opens this page to:

1. see which stages have objections or remarks;
2. jump into those stages to correct the data (stage pages open in **objection mode**);
3. close (remove) individual objections once fixed.

When no objections are left, the user is sent back to the dashboard.

## 2. Layout

* Header with hidden `lblskrefno`, `lblformno`.
* An "Objections Pending" banner (`.objection-banner`) with a button that opens `#infoModal` ("Objections Summary").
* An 11-button stage list (`step_1` … `step_11`), visually the same as the tracker (step 8 Family Detail is shown here).

## 3. Behaviour

| Event | Action |
|---|---|
| Page load | `POST NRIAccountOpening/GetObjectionFormDetails "<skrefno>"` → `Data` = `{ "1": {Remarks, Objections[]}, …, "11": … }` stored in `objectionDataStore` |
| For each stage 1–11 | Has objections or remarks → class `step-objection`, status "Objection Raised", badge with the count (or "!"), **clickable**. Otherwise → `step-completed-status`, "Completed", disabled |
| No stage has objections | Banner fades out and "All Objections Closed!" popup → auto-redirect to `/Onboarding/Home/Index` after 5 s (or on OK) |
| Click an objection stage | Navigates to `/Onboarding/nriaccountopening2/{page}?formNo=&skrefno=&remarks=<Remarks>&objections=<JSON array>&objectionCount=<n>&stepId=<id>&stepName=<name>` |
| Open "Objections Summary" modal | Accordion per stage with each objection text and a 🗑 **remove** button |
| Remove objection | Confirm "Remove Objection?" → `POST NRIAccountOpening/closeobjection { skReferenceNo, Objections: "<ObjectionID>" }` → on success removes it locally, refreshes cards and accordion, reloads from the server, "Removed!" toast |

Stage → page map: 1 `inward`, 2 `address`, 3 `holder`, 4 `fatca`, 5 `proof`, 6 `nominee`, 7 `miscellaneous`, 9 `extradetailspage`, 10 `brokerage`, 11 `bankdetails` (8 has no route).

## 4. How the stage pages use the query parameters (objection mode)

Every stage view renders `remarks`, `objections`, `objectionCount`, `stepId`, `stepName` into hidden inputs. The stage script then:

* shows `#objectionWarningBanner` ("N objections need your attention") and a modal listing remarks and objection texts;
* loads the previously saved data from the server (`Get…onformid` / `Get…Details`);
* after save, redirects back to **this page** instead of `forminward`.

Pages without objection support: Miscellaneous, Brokerage (always return to `forminward` / success).

## 5. Known issues

* Objections are passed as JSON in the URL, which can hit URL-length limits for long lists.
* "Remove" closes the objection on the server even if the data was not actually corrected; there is no link between the edit and the closure.
* Step 8 (Family Detail) is displayed but has no route.

## 6. React migration notes

* Route `/onboarding/objections/:skRefNo` with `useObjections(skRefNo)`.
* Pass objection context to stage routes through router state or a store (not the query string).
* `<ObjectionBanner stepId />` shared by every stage, reading from the same store.
