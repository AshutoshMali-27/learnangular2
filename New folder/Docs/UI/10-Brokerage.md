# Stage 10 – Brokerage (`brokerage`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/brokerage?formNo=&stageId=&skrefno=&...` |
| Controller action | `nriaccountopening2Controller.brokerage` |
| View | `Views/nriaccountopening2/brokerage.cshtml` |
| Scripts | `validations.js`, `brokerage2.js` |
| Server APIs | [BrokerageController.md](../API/BrokerageController.md), `NRIAccountOpening/GetBrokerageData` |

## 1. Purpose

Lets the user pick the client's **brokerage scheme (tariff plan)**. After a scheme is chosen, its full charge sheet is shown read-only for confirmation, and the scheme id is saved against the form.

## 2. Controls

| # | Label | Id | Control | Behaviour |
|---|---|---|---|---|
| 1 | Brokerage Scheme | `txtBrokerageScheme` | text max 50 (letters/digits only) + suggestion list `#BrokerageSchemeSuggestionsList` | After 2+ characters, filters the scheme list **client-side** (case-insensitive "contains"). The user must click a suggestion; free text is cleared on blur |
| 2 | Save | `saveBtn` | button | Hidden until a scheme is selected |

Read-only charge sheet `#divBrokerageDetails` (shown after selection), heading `#SchemeNameHeading` = scheme `name`:

| Section | Label → element id ← response field |
|---|---|
| Brokerage Summary | Cash Delivery `CashDelivery` ← `cash_delivery`; Cash Intraday `CashIntraday` ← `cash_intraday`; Cash Futures `CashFutures` ← `cash_futures`; Cash Options `CashOptions` ← `cash_options`; Currency Futures `CurrencyFutures` ← `currency_futures`; Currency Options `CurrencyOptions` ← `currency_options`; MCX Futures `MCXFutures` ← `mcx_futures`; MCX Options `MCXOptions` ← `mcx_options` |
| DP & Operating Charges | Operating Charges `OperatingCharges` ← `dp_operating_charges`; Ongoing ISIN `OngoingISIN` ← `ongoing_isin`; MTF Pledge/Unpledge `MTFPledgeUnpledge` ← `mtf_pledge_unpledge`; Margin Pledge/Unpledge `MarginPledgeUnpledge` ← `margin_pledge_unpledge` |
| Other Charges | Account Opening `AccountOpening` ← `accountopening`; MTF up to 25 Lacs `MTFUpto25Lacs` ← `mtf_upto_25_lakhs`; MTF 25 Lacs–5 Cr `MTF25LacsTo5Cr` ← `mtf_upto_25_lakhs_5_crore`; MTF above 5 Cr `MTFAbove5Cr` ← `mtf_above_5_crore`; Margin Pledge `MarginPledge` ← `margin_pledge`; Delayed Payment Charges `DelayedPaymentCharges` ← `delayed_payment_charges` |

## 3. Flow and API calls

| Step | Call | Notes |
|---|---|---|
| Load | `POST Brokerage/GetBrokerageSchemeNames` | `{ data: [{ BrokerageSchemeName, BrokerageSchemeID }] }`, cached in memory for the autocomplete |
| Load | `POST NRIAccountOpening/GetInProcessData {formNumber}` | `Is_Bank_Available` → decides the next page |
| Pick suggestion | `POST NRIAccountOpening/GetBrokerageData {masterCode:"10", parameter1:<schemeId>}` | Returns one `BrokerageDataModel` → fills the charge sheet, shows Save |
| Save | `POST Brokerage/SaveBrokerage {FormEntryID, EmployeeCode, BrokerageID}` | `message === "Success"` |

## 4. After save – end of data entry (no bank) or go to Bank stage

| `Is_Bank_Available` | Redirect |
|---|---|
| `Y` | `forminward` → tracker shows **Bank Detail** as the next stage |
| `N` | `formsucess` – the journey is complete ([12-FormSuccess.md](12-FormSuccess.md)) |

## 5. Known issues

1. **No pre-fill**: `Brokerage/GetBrokerage` (saved scheme) is never called and there is no objection mode.
2. Scope bug: the selection is stored in a global `SelectedBrokerageID`, but the blur handler checks an inner variable of the same name. Re-focusing and leaving the textbox after selecting therefore clears the text and hides the charge sheet, while Save still sends the old id.
3. Only letters and digits are allowed in the search box, so scheme names containing spaces or symbols cannot be typed fully.

## 6. React migration notes

* `<Combobox options={schemes} onSelect={setScheme} />` (headless UI / MUI Autocomplete) instead of the custom list.
* `useQuery(['brokerage', schemeId], GetBrokerageData)` to render `<ChargeSheet data />` from a config array of `{label, field, section}`.
* Next route derived from `isBankAvailable`.
