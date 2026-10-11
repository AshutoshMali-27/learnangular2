# nriaccountopening2Controller

**File:** `Controllers/nriaccountopening2Controller.cs`  
**Route prefix:** `/Onboarding/nriaccountopening2/{action}`  
**Purpose:** Page routing for the NRI account-opening wizard steps, plus the customer-facing liveliness capture page.

**This controller consumes no downstream APIs.** Each step page loads and saves data by calling the JSON actions in the other controllers (holder, Fatca, Proof, Nominee and so on).

## Common behaviour

Every action except `capturedetails` redirects to `/Onboarding/Auth/Login` when session `empId` is empty, and sets these ViewBag values:

`Employeecode`, `branchid`, `empId` (from session) and `formNo`, `skrefno`, `remark`, `objections`, `objectionCount`, `stepId`, `stepName` (from the query string).

Common query parameters:

| Param | Type | Meaning |
|---|---|---|
| `formNo` | string | Form number |
| `stageId` | string | Current saved stage of the form (normal flow) |
| `skrefno` | string | SK reference no (FormEntryID) |
| `remarks` | string | Objection remarks |
| `objections` | string | Objection list |
| `objectionCount` | int? | Number of objections |
| `stepId` | string | Step being corrected (objection flow) |
| `stepName` | string | Step display name |

## Step routing

`X` is the stage number of each page. The page is shown when `stageId == X`, or when `stageId == null && stepId == X` (objection flow). Otherwise:

| Action | Stage X | When `stageId != X && stepId == null` | When `stageId == null && stepId != X` |
|---|---|---|---|
| `forminward` | – | always returns the view (`ViewBag.stageId = stageId + 1`) | – |
| `objectionforminward` | – | always returns the view | – |
| `inward` | 1 | view (also sets `branchTypeCode`, `BsdaValue` from `CheckboxSettings:BsdaValue`) | → `NRIAccountOpening/ObjectionForms` |
| `address` | 2 | → `nriaccountopening2/FormInward` | → `NRIAccountOpening/ObjectionForms` |
| `holder` | 3 | view | → `NRIAccountOpening/ObjectionForms` |
| `fatca` | 4 | → `FormInward` | → `ObjectionForms` |
| `proof` | 5 | → `FormInward` | → `ObjectionForms` |
| `nominee` | 6 | → `FormInward` | → `ObjectionForms` |
| `miscellaneous` | 7 | view | → `ObjectionForms` |
| `extradetailspage` | 9 | view | → `ObjectionForms` |
| `brokerage` | 10 | → `FormInward` | → `ObjectionForms` |
| `bankdetails` | 11 | → `FormInward` | → `ObjectionForms` |
| `familydetails` | – | always returns the view | – |
| `formsucess` | – | view (`formNo`, `skrefno`) | – |

All of these are `GET` and return HTML.

## capturedetails (customer liveliness page)

`GET /Onboarding/nriaccountopening2/capturedetails?q=<cipherText>.<iv>`

* **No session check**: this link is sent to the customer by email.
* `q` is split on `.`. The first part is the AES-GCM ciphertext and the last part is the IV (spaces are turned back into `+`). It is decrypted with `Account:AESKey` into `selfierequestmodel`:

```json
{ "FormNo": "NRI000123", "SkRefNo": "100045", "PANNumber": "ABCDE1234F", "HolderType": "1" }
```

* ViewBag: `formNo`, `skrefno`, `PANNumber`, `HolderType` and `LivelinessSDKConfig { ScriptUrl, ClientKey, ApiUrl, ApiKey, RedirectUrl, RefId }` from config.
* The page runs the face-liveliness SDK and then posts the result to `ExtraDetails/SaveSDKImage` (see [ExtraDetailsController.md](ExtraDetailsController.md)).

> An invalid or malformed `q` throws an unhandled exception, so the user gets the error page.
