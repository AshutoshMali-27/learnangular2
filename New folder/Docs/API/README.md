# OneKYC Onboarding App – API Documentation

This folder documents every controller action in the `jhv` (OneKYC NRI onboarding) web app, and every **downstream API the controllers consume**. Each action entry gives the request and response at both levels:

1. **Controller endpoint**: what the browser (Razor views / jQuery) calls.
2. **Downstream API**: what the controller calls on the backend services, the payload it sends and the response it parses.

## Controller index

| Controller | File | Consumes downstream APIs? |
|---|---|---|
| AuthController | [AuthController.md](AuthController.md) | Yes: PowerAdmin, OpenAccountService, UtilityService (OTP), Forgetpassword |
| HomeController | [HomeController.md](HomeController.md) | Yes: NRI form generation, Master, Dashboard |
| NRIAccountOpeningController | [NRIAccountOpeningController.md](NRIAccountOpeningController.md) | Yes: largest surface (form inward, PAN, masters, reports, PDFs, courier) |
| nriaccountopening2Controller | [nriaccountopening2Controller.md](nriaccountopening2Controller.md) | No: view routing only |
| holderController | [holderController.md](holderController.md) | Yes: holder details, PAN, masters, email/mobile checks |
| FatcaController | [FatcaController.md](FatcaController.md) | Yes: FATCA, TIN validation (CISCore), masters |
| ProofController | [ProofController.md](ProofController.md) | Yes: proof details, document master, file I/O |
| NomineeController | [NomineeController.md](NomineeController.md) | Yes: nominee details, masters, existing customer |
| BankDetailController | [BankDetailController.md](BankDetailController.md) | Yes: bank details, IFSC master, CheckBank |
| BrokerageController | [BrokerageController.md](BrokerageController.md) | Yes: brokerage scheme |
| MiscellaneousController | [MiscellaneousController.md](MiscellaneousController.md) | Yes: misc/consent details, AMC master |
| OtherDetailsController | [OtherDetailsController.md](OtherDetailsController.md) | Yes: family details, income slab master |
| ExtraDetailsController | [ExtraDetailsController.md](ExtraDetailsController.md) | Yes: other details, liveliness, email, TAB e-sign |
| EmailController | [EmailController.md](EmailController.md) | Yes: email verification |
| SearchController | [SearchController.md](SearchController.md) | Yes: dashboard search |
| ErrorController | [ErrorController.md](ErrorController.md) | No |

---

## 1. Routing

Configured in `Program.cs`:

```
{URLPath}/{controller=Auth}/{action=Login}
```

`URLPath` = `Onboarding`, so every action is reachable at `/Onboarding/{Controller}/{Action}`, for example `POST /Onboarding/BankDetail/SavebankDetails`.

## 2. Base URLs (from `appsettings*.json`)

| Config key | Used as | UAT value |
|---|---|---|
| `AppSettings:baseurl` | `{baseurl}`: OpenAccountService, UtilityService, CommunicationService | `https://onekycuat.sharekhan.com/` |
| `AppSettings:baseurl2` | `{baseurl2}`: CISCore (TIN validation) | `https://ciscoreuat.sharekhan.com/` |
| `PowerAdmin:baseurl3` | PAL login status | `https://poweradminuat.sharekhan.com/AppAuthentication_Service/api/Auth/GetLoginStatus` |
| `TAB:getToken` / `TAB:GetEmpSign` | TAB sales e-sign service | `https://tabuat.sharekhan.com/tabsales/api/CisMaster/...` |
| `AppSettings:networkFolder` | File share for uploaded documents | `\\...\OneKyc_UAT\NRI` |

> Most controllers **hard-code** the downstream path (for example `OpenAccountService/api/v1/AccountStaging/SetBankDetails`). The `OpenAccountService:*`, `UtilityServices:*` and `CISCoreUAT:*` sections in appsettings are only partly used. Only `HomeController` reads its URLs (`AllocatedForms:*`, `Dashboard:*`) from config.

## 3. Downstream authentication (`Models/Auth/services/GenerateToken.cs`)

Every downstream call except PowerAdmin, `Forgetpassword/*` and `Dashboard/GetSearchData` sends `Authorization: Bearer <token>`. A new token is generated **on every call**.

| Method | Token endpoint | Request body | Token read from |
|---|---|---|---|
| `GenerateTokenUsingStoredCredentials()` | `POST {baseurl}OpenAccountService/api/v1/Token/authentication` | `{ "username": <AuthenticationCredentials:Username>, "password": <AuthenticationCredentials:Password> }` | `Data.token` |
| `GenerateTokenforutilityserivce()` | `POST {baseurl}UtilityService/v2/Authentication` | `{ "username": "TestUsername", "password": "TestPassword" }` (hard-coded) | `Data.token` |
| `GenerateTokenfocommunicationserivce()` | `POST {baseurl}CommunicationService/v2/Authentication` | `{ "username": "TestUsername", "password": "TestPassword" }` (hard-coded) | `Data.token` |
| `GenerateTokenUsingStoredCredentialsforciscore()` | `POST {baseurl2}api/Token/authentication` | same as stored credentials | `Data.token` |
| `GenerateTokenforTABservice()` | `POST {TAB:getToken}` | `{ "UserName": <TAB:UserName>, "Password": <TAB:Password> }` | `Data.Token` |

Token endpoint response shape:

```json
{ "Message": "Success", "Data": { "token": "eyJhbGciOi..." }, "Description": "" }
```

Failure → the method returns `null`, and the downstream call is then sent with `Bearer ` (empty) and typically fails with 401.

## 4. Common response envelopes from downstream services

### 4.1 Encrypted envelope (`Clsddlresponse`, `submitformresponse`, `EncryptedApiResponse`, `Clsexistinginwardresponse`)

```json
{
  "Message": "Success",
  "Data": { "CipherText": "<base64>", "InitialVector": "<base64 12-byte IV>" },
  "Description": ""
}
```

`Data` is decrypted with **AES-256-GCM** (128-bit tag) using `Account:AESKey` (`IDryptstring.DecryptStringAESGCM`). The plaintext is a JSON array, and each endpoint below describes it as *Decrypted payload*.

### 4.2 Plain envelope (`ClsValidateResponse`)

```json
{ "Status": "Success", "Message": "Success", "Data": { }, "Description": "" }
```

Some AccountStaging GET APIs use lowercase keys (`status`, `data`, `description`).

### 4.3 Error envelope (`errorresponse`)

```json
{ "Message": "Failure", "Data": null, "Description": "Human readable reason" }
```

ASP.NET validation errors (400) come back as `ValidationErrorResponse`:

```json
{ "type": "...", "title": "One or more validation errors occurred.", "status": 400,
  "errors": { "Field": ["message"] }, "traceId": "..." }
```

## 5. Master API (`GetMaster`): master code reference

Many dropdown actions call the same API:

```
POST {baseurl}OpenAccountService/api/v2/Master/GetMaster
Authorization: Bearer <OpenAccountService token>
```

```json
{ "masterCode": 7, "parameter1": "<optional>", "parameter2": "", "parameter3": "", "parameter4": "", "parameter5": "" }
```

Response: encrypted envelope (§4.1). The decrypted payload depends on `masterCode`:

| masterCode | Meaning | parameter1 | Decrypted item model | Used by |
|---|---|---|---|---|
| 1 | Email / mobile relation | – | `EmailRelation { relationship_id, relationshipname }` | NRIAccountOpening, holder |
| 2 | Serving branch | – | `branchdetails { branch_id, branch_name }` | NRIAccountOpening |
| 3 | Admin details | – | `admindetails { admin_id, admin_id1 }` | NRIAccountOpening |
| 4 | DP master | – | `DPmaster { dp_number, dp_name }` | NRIAccountOpening |
| 6 | Country | – | `CountryMaster { country_id, country_name }` | NRIAccountOpening, holder |
| 7 | State | country id | `stateMaster { state_id, state_name }` | NRIAccountOpening, holder |
| 8 | City | state id | `cityMaster { city_id, city_name }` | NRIAccountOpening, holder |
| 9 | Occupation | – | `occupationmaster { occupation_id, occupation_name }` | holder |
| 11 | Bank IFSC lookup | IFSC | `BankIfscModel` | BankDetail |
| 12 | AMC type | – | `amctypemaster { amc_name, amcid }` | Miscellaneous |
| 13 | Income slab | – | `incomeslabmaster { income_slab_id, income_slab }` | OtherDetails |
| 14 | Nominee relation | – | `nomenieeRelation { nom_relationship_id, nom_relationship_name }` | Nominee |
| 17 | KMP designation | – | `KMPDesignationMaster { serialno, description }` | NRIAccountOpening |
| 18 | Proof document type | – | `documentmaster` | Proof |
| 19 | Nationality (FATCA) | from client | `countrymasterforfatca { country_name, country_code }` | Fatca |
| 32 | Form version (**v1** GetMaster) | `"NRI"` (+ `parameter2` = branchId) | dynamic JSON | Home |
| 44 | Nature of business | – | `BusinessCategory { SERIALNO, DESCRIPTION }` | Fatca |
| 45 | City (FATCA) | – | `cityMaster` | Fatca |
| 50 | FATCA country | – | `fatcaCountryMaster { country_id, country_name, fatca_country_code }` | Fatca |
| 52 | Form status | – | `FormStatus { FORM_STATUS_ID, FORM_STATUS }` | NRIAccountOpening |
| client-supplied | Brokerage plan details | plan id | `BrokerageDataModel` | NRIAccountOpening.GetBrokerageData |
| client-supplied | FATCA source of wealth | client-supplied | `fatcasourceofwelthmaster { fsw_code, fsw_sourceofwealth }` | Fatca.getfatcasourceofwelth |

Common controller responses for master actions:

| Case | Body |
|---|---|
| Success | JSON array of the decrypted model (empty array if `Data` is null) |
| 401 from downstream | `{ "success": false, "message": "You are not authorized to perform this action. Please log in again.", "status": 401 }` |
| Other non-2xx | `{ "success": false, "message": "Failed to fetch ...", "status": <code> }` |
| Exception | `{ "success": false, "message": "Internal server error: <ex>" }` |

All of these are returned with **HTTP 200** (as `JsonResult`).

## 6. Conventions on the controller side

* **Anti-forgery**: almost all POST actions call `IAntiforgery.ValidateRequestAsync`. The client must send the token in the `RequestVerificationToken` header (or as a `__RequestVerificationToken` form field) together with the `OnboardingRequestVerificationToken` cookie. If the token is invalid the action returns **HTTP 400**:

  ```json
  { "success": false, "message": "Anti Forgery Token was invalid." }
  ```

  Each document says which actions skip this check.
* **Session**: views and some actions read `empId`, `branchId`, `empcode`, `branchTypeCode` and `empname` from the ASP.NET session, which is set at login. View actions redirect to `/Onboarding/Auth/Login` when `empId` is missing. JSON actions **do not** check the session.
* **`[FromBody] string`**: actions such as `GetMiscDetails([FromBody] string formEntryID)` expect a **raw JSON string** body, for example `"12345"`, not an object.
* **`[FromForm] string model`**: actions such as `SaveFormDetails`, `SaveExtraDetails` and `SavenomineeData` expect a form field named `model` whose value is a JSON-serialised object.
* **HTTP status**: many actions return **200** with a failure message in the body. Clients must check `message` / `isValid` / `success`, not just the status code.
* **File storage**: uploaded files are saved to `{networkFolder}\{formNo}_{panNo}\<generated name>`. The returned relative `filePath` (`{formNo}_{panNo}/<file>`) is what gets persisted through the save APIs.

## 7. Downstream API catalogue (all distinct endpoints)

| # | Method | Downstream URL | Consumed by |
|---|---|---|---|
| 1 | POST | `{PowerAdmin:baseurl3}` (GetLoginStatus) | Auth.Login |
| 2 | POST | `OpenAccountService/api/v1/Admin/ValidateLogin` | Auth.Login |
| 3 | POST | `OpenAccountService/api/v1.0/Admin/LoginValidate` | Auth.Authenticateuser |
| 4 | POST | `OpenAccountService/api/v1/Admin/FetchLoginDetails` | Auth.getuserdetailsaftervalidate |
| 5 | POST | `UtilityService/OTP/v2/Send` | Auth.SendOtpAsync |
| 6 | POST | `UtilityService/OTP/v2/Verify` | Auth.verifyotp |
| 7 | GET | `Forgetpassword/getDataforforgetpassword` | Auth |
| 8 | GET | `Forgetpassword/sendOTPforforgetpassword` | Auth |
| 9 | GET | `Forgetpassword/verifyOTPforgetpassword` | Auth |
| 10 | GET | `Forgetpassword/Get_UserDatabyuserID` | Auth |
| 11 | GET | `Forgetpassword/setResetpassword` | Auth |
| 12 | POST | `OpenAccountService/api/v1/NRI/GenerateNRIFormNumber` | Home.CreateForm |
| 13 | POST | `OpenAccountService/api/v1/Master/GetMaster` (v1) | Home.getformversionmaster |
| 14 | POST | `OpenAccountService/api/v2/Master/GetMaster` | many (see §5) |
| 15 | POST | `OpenAccountService/api/v1/NRI/GetDashboardCounts` | Home.GetDashboardCounts |
| 16 | POST | `OpenAccountService/api/v1/Master/MasterValidate` | NRIAccountOpening (lead/REC/remiser/sales) |
| 17 | POST | `OpenAccountService/api/v1/NRI/ValidateFormNumber` | NRIAccountOpening.CheckFormNo |
| 18 | POST | `OpenAccountService/api/v1/NRI/CheckPanNo` | NRIAccountOpening.CheckPanNo |
| 19 | POST | `UtilityService/DigitalVerification/v2/PrefillPAN` | NRIAccountOpening, holder |
| 20 | POST | `OpenAccountService/api/v1/Digital/PANInquiryITD` | NRIAccountOpening, holder |
| 21 | POST | `UtilityService/Screening/v2/NegativeListCheck` | NRIAccountOpening |
| 22 | POST | `UtilityService/Screening/v1/NegativeListCheck` | holder |
| 23 | POST | `OpenAccountService/api/v1/NRI/CheckEmail` | NRIAccountOpening, holder |
| 24 | POST | `OpenAccountService/api/v1/NRI/SendVerificationEmail` | NRIAccountOpening |
| 25 | POST | `OpenAccountService/api/v1/NRI/CheckMobileNo` | NRIAccountOpening, holder |
| 26 | POST | `OpenAccountService/api/v1/NRI/FormInward` | NRIAccountOpening.SaveFormDetails |
| 27 | POST | `OpenAccountService/api/v1/NRI/GetFormInwardDetails` | NRIAccountOpening.GetFormDetails |
| 28 | POST | `OpenAccountService/api/v1/AccountStaging/SetAddress` | NRIAccountOpening, holder |
| 29 | POST | `OpenAccountService/api/v1/AccountStaging/GetAddress` | NRIAccountOpening |
| 30 | POST | `OpenAccountService/api/v1/NRI/GetReportDetails` | NRIAccountOpening |
| 31 | POST | `OpenAccountService/api/v1/NRI/GetDataObjectionForms` | NRIAccountOpening |
| 32 | POST | `OpenAccountService/api/v1/NRI/GetInProcessDetails` | NRIAccountOpening |
| 33 | POST | `OpenAccountService/api/v1/NRI/GetExistingCustomerDetails` | NRIAccountOpening, Nominee, Fatca |
| 34 | POST | `OpenAccountService/api/v1/NRI/GetDataObjections` | NRIAccountOpening |
| 35 | POST | `OpenAccountService/api/v2/ScrutinyService/CloseObjection` | NRIAccountOpening |
| 36 | POST | `OpenAccountService/api/v1/NRI/GetFormDetailsForPDFUpload` | NRIAccountOpening |
| 37 | POST | `OpenAccountService/api/v1/NRI/SignedPDFUpload` | NRIAccountOpening |
| 38 | POST | `OpenAccountService/api/v1/NRI/ResendGeneratedPDF` | NRIAccountOpening |
| 39 | POST | `OpenAccountService/api/v1/NRI/UploadPDFWithBankDetails` | NRIAccountOpening |
| 40 | POST | `OpenAccountService/api/v1/AccountStaging/GetFormWithLivelinessPending` | NRIAccountOpening |
| 41 | POST | `OpenAccountService/api/v1/AccountStaging/SendLivelinessMail` | NRIAccountOpening |
| 42 | POST | `OpenAccountService/api/v1/NRI/AccountStatusReportSearch` | NRIAccountOpening |
| 43 | POST | `OpenAccountService/api/v1/NRI/GetAvaliableFormDetails` | NRIAccountOpening |
| 44 | POST | `OpenAccountService/api/v1/NRI/ClientToBranchCourierPendingForms` | NRIAccountOpening |
| 45 | POST | `OpenAccountService/api/v1/NRI/ClientCourierRecieved` | NRIAccountOpening.SaveCourierDetails |
| 46 | POST | `OpenAccountService/api/v1/NRI/CourierSentToHO` | NRIAccountOpening.SaveCourierDetails |
| 47 | POST | `OpenAccountService/api/v1/AccountStaging/SetHolderDetails` | holder |
| 48 | POST | `OpenAccountService/api/v1/AccountStaging/GetHolderDetails` | holder |
| 49 | POST | `OpenAccountService/api/v1/AccountStaging/SetFatcaDetails` | Fatca |
| 50 | POST | `OpenAccountService/api/v1/AccountStaging/GetFetchDetails` | Fatca |
| 51 | POST | `{baseurl2}api/DigitalCMC/VerifiyTINStructure` | Fatca |
| 52 | POST | `OpenAccountService/api/v1/AccountStaging/SetProofDetails` | Proof |
| 53 | POST | `OpenAccountService/api/v1/AccountStaging/GetProofDetails` | Proof |
| 54 | POST | `OpenAccountService/api/v1/AccountStaging/SetNomineeDetails` | Nominee |
| 55 | POST | `OpenAccountService/api/v1/AccountStaging/GetNomineeDetails` | Nominee |
| 56 | POST | `OpenAccountService/api/v1/AccountStaging/SetBankDetails` | BankDetail |
| 57 | POST | `OpenAccountService/api/v1/AccountStaging/GetBankDetails` | BankDetail |
| 58 | POST | `OpenAccountService/api/v1/Account/CheckBank` | BankDetail |
| 59 | POST | `OpenAccountService/api/v1/AccountStaging/GetBrokerageSchemeNames` | Brokerage |
| 60 | POST | `OpenAccountService/api/v1/AccountStaging/SetBrokerageID` | Brokerage |
| 61 | POST | `OpenAccountService/api/v1/AccountStaging/GetBrokerageID` | Brokerage |
| 62 | POST | `OpenAccountService/api/v1/AccountStaging/SetMiscDetails` | Miscellaneous |
| 63 | POST | `OpenAccountService/api/v1/AccountStaging/GetMiscDetails` | Miscellaneous |
| 64 | POST | `OpenAccountService/api/v1/AccountStaging/SetFamilyDetails` | OtherDetails |
| 65 | POST | `OpenAccountService/api/v1/AccountStaging/GetFamilyDetails` | OtherDetails |
| 66 | POST | `OpenAccountService/api/v1/AccountStaging/SetOtherDetails` | ExtraDetails |
| 67 | POST | `OpenAccountService/api/v1/AccountStaging/GetOtherDetails` | ExtraDetails |
| 68 | POST | `OpenAccountService/api/v1/AccountStaging/SaveLivelinessDetails` | ExtraDetails |
| 69 | POST | `CommunicationService/Email/v2/SendMail` | ExtraDetails |
| 70 | GET | `{TAB:GetEmpSign}?empCode=` | ExtraDetails |
| 71 | POST | `OpenAccountService/api/v1/NRI/VerifyEmail` | Email |
| 72 | GET | `Dashboard/GetSearchData` | Search |
