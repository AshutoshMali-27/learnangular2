# Account Status Report – In-depth View (`NRIAccountOpening/AccountStatusreport`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/NRIAccountOpening/AccountStatusreport?formNo=&custId=` (opened from the Account Status search grid) |
| View | `Views/NRIAccountOpening/AccountStatusreport.cshtml` |
| Script | `wwwroot/pages/accountstatusdetailedreport.js` |

## Purpose

A **read-only 360° view** of one client / account: master data, addresses, bank accounts, FATCA, proofs, DP accounts and nominees. There are no inputs; the only interaction is switching tabs and expanding FATCA / nominee rows.

## Data load

On page load: `POST /Onboarding/NRIAccountOpening/getaccountstatusdetailedreports` with `SearchRequest { customerId: <custId>, formNumber: custId ? "" : formNo, … all others "" }` → server `Mode = "INDEPTH_SEARCH"` → `AccountStatusReportInDepthReport` (see [API doc](../API/NRIAccountOpeningController.md#40-getaccountstatusdetailedreports)). If `ClientData` is missing → "Failed to load account details."

## Layout

**Summary card** (`#accountSummaryCard`): avatar initials (from `PANNAME`), `accountName` (`PANNAME`), Form No (`FORMNO`), PAN (`PANNO`), S2K ref (`S2K_ID`), form-status and account-status badges.

**Tabs** (`.detail-tab-btn[data-tab]` → `#tab-{id}`):

| Tab | Content | Source |
|---|---|---|
| Client (`client`) | ~95 read-only fields: name / OVD name, PAN, DOB, gender, mobile and email (+ relationship), nationality, occupation, marital status, birth place / country, father / mother / maiden name, Aadhaar and PAN–Aadhaar link status, residential status, phone / fax, Customer ID, S2K ID, Login ID, client code, branch code / name, account open date, account type, NRI type, running-account indicator / expiry, KYC status / no, CKYC KIN / reg date, existing KYC, nominee available, sales executive, mode of operation, contract note, trade channel, online / offline, remisier, products, MF terms, gross income / income slab / expiry, net worth and date, source of wealth, KRA status / agency / fetch date, IVR code, advisory product, commodity-option trading, DP-to-margin, MFS allowed, IMPS verified, consent e-form, consent margin funding, TSBA, financial docs, SMO / NPO / UBO flags and UBO count / company, cheque image, DIS booklets NRE / NRO, admin, insta-scrutiny status / remark, RBI approval refs / date, residual share payable, nominee share, citizenship, former alias, DP tariff schemes | `ClientData` (ids `client*`) |
| Address (`address`) | Registered, Communication, Jurisdiction (incl. country of residence, place / country of birth, tax id) | `RegisteredAddressDetails`, `CommunicationAddressDetails`, `ClientJurisdictionDetails` |
| Bank (`bank`) | Table: Sr No, Bank Name, Account Number, Account Type, IFSC, MICR, Branch Name, Status, Default, Proof Uploaded, UPI VPA, IMPS Flag, Reverse Penny Flag | `BankDetails[]` |
| FATCA (`fatca`) | Expandable rows: Client Code, Holder Type, Nationality → details including tax-identification rows | `FATCADetail[]` |
| Proof (`proof`) | Sr No, Proof Type, Proof No, Valid From, Valid To, Proof Place | `DocProofDetails[]` |
| DP Details (`dpdetails`) | DP name, DP id number, type, beneficiary name, client beneficiary id, DP-with-client id, status, default, POA, BSDA, Investtiger status | `DPDetail[]` |
| Nominee (`nominee`) | Expandable rows: nominee name, share, relation → details + guardian when the nominee is a minor | `NomineeDetail[]` |
| Extra (`tab-extra`) | IPV emp code / date / branch, OSV staff / date, interviewed staff, country of residence / income, investment, nature of business, KMP, alias name | `Client Extra Detail` (no tab button – not reachable) |

## React migration notes

`<AccountReport custId formNo>` with a single query, a `<SummaryCard>` and `<Tabs>`. Render the large "Client" section from a field-config array `{label, path}` instead of 95 hand-written elements. Use read-only description lists and expandable table rows for FATCA / nominees.
