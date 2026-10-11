# AuthController

**File:** `Controllers/AuthController.cs`  
**Route prefix:** `/Onboarding/Auth/{action}`  
**Purpose:** Employee login (PAL/PowerAdmin SSO and username/password + OTP), captcha, logout and the forgot-password flow.

See [README.md](README.md) for base URLs, token generation and response envelopes.

## Summary

| # | Controller action | HTTP | Downstream API(s) consumed |
|---|---|---|---|
| 1 | `Login` (form post) | POST | PowerAdmin `GetLoginStatus`, `OpenAccountService/api/v1/Admin/ValidateLogin` |
| 2 | `GetPalLoginStatusAsync` (helper, publicly routable) | any | `OpenAccountService/api/v1/Admin/ValidateLogin` |
| 3 | `Login` (view) | GET | – |
| 4 | `auth` (view) | GET | – |
| 5 | `Authenticateuser` | POST | `OpenAccountService/api/v1.0/Admin/LoginValidate`, `UtilityService/OTP/v2/Send` |
| 6 | `SendOtpAsync` | POST | `UtilityService/OTP/v2/Send` |
| 7 | `getuserdetailsaftervalidate` | POST | `OpenAccountService/api/v1/Admin/FetchLoginDetails` |
| 8 | `verifyotp` | POST | `UtilityService/OTP/v2/Verify` (+ #7) |
| 9 | `verifyOTPforforgetpassword` (POST overload) | POST | – (hard-coded OTP) |
| 10 | `Logout` | POST | – |
| 11 | `ValidateCaptcha` | POST | – |
| 12 | `ForgetPassword` (view) | GET | – |
| 13 | `getDataforforgetpassword` | GET | `Forgetpassword/getDataforforgetpassword` |
| 14 | `SendOTPmailforResetPassword` | GET | `Forgetpassword/sendOTPforforgetpassword` |
| 15 | `ValidateOTP` (view) | GET | – |
| 16 | `ValidateOTPforLogin` (view) | GET | – |
| 17 | `verifyOTPforforgetpassword` (GET overload) | GET | `Forgetpassword/verifyOTPforgetpassword` |
| 18 | `getdatabyuserid` | GET | `Forgetpassword/Get_UserDatabyuserID` |
| 19 | `resetpassword` (view) | GET | – |
| 20 | `SetResetpassword` | GET | `Forgetpassword/setResetpassword` |
| 21 | `ValidatePassword` | POST | – |

---

## 1. Login (PAL / PowerAdmin SSO)

`POST /Onboarding/Auth/Login` with `Content-Type: application/x-www-form-urlencoded` (`[FromForm] LoginRequest`). **No anti-forgery check.**

### Controller request

| Field | Type | Description |
|---|---|---|
| `Un` | string | User id (PAL login name) |
| `SecKey` | string | Security key, which must parse as `long` |
| `Code` | string | Employee code |
| `App` | string | Not used |

### Downstream call 1: PowerAdmin GetLoginStatus (`PalService.GetLoginStatusAsync`)

```
POST {PowerAdmin:baseurl3}
Content-Type: application/json
(no Authorization header)
```

Request:

```json
{ "UserId": "<Un>", "SecurityCode": "<SecKey>", "EmpCode": "<Code>" }
```

Response (string array):

```json
["Yes", "..."]
```

The flow continues only when `response[0] == "Yes"`.

### Downstream call 2: ValidateLogin (`GetPalLoginStatusAsync`)

```
POST {baseurl}OpenAccountService/api/v1/Admin/ValidateLogin
Authorization: Bearer <OpenAccountService token>
```

Request:

```json
{ "Un": "<Un>", "EmpCode": "<Code>", "SecurityKey": "<SecKey>" }
```

Response (`PalLoginResponse`, not encrypted):

```json
{
  "Message": "Success",
  "Data": {
    "MYROWID": 0, "LOGINID": 0, "LOGINNAME": "", "SF": "", "UPDATEDATE": "2025-01-01T00:00:00",
    "COUNTER": 0, "ACCOUNT_STATUS": "", "EMPNAME": "", "EMP_CODE": "", "EMPID": 0,
    "BRANCH_ID": 0, "BRANCH_NAME": "", "BRANCH_CODE": "", "PINCODE": "", "SERVICED": "",
    "BRANCH_TYPE_CODE": ""
  },
  "Description": ""
}
```

### Controller response

| Case | Result |
|---|---|
| Success | Session set (`branchId`, `empId`, `empcode`, `empname`, `branchCode`, `branchTypeCode`, `LoginTime`, `UserName`, `Role=Employee`), then **302 → `/Onboarding/Home/Index`** |
| Missing fields | Login view re-rendered |
| PAL status ≠ "Yes", or ValidateLogin fails | Login view re-rendered |
| Bad `SecKey` / exception | **302 → `/Onboarding/Auth/Login`** |

---

## 2. GetPalLoginStatusAsync

This public helper has no `[NonAction]` attribute, so MVC also exposes it as `/Onboarding/Auth/GetPalLoginStatusAsync?username=&secKey=&code=`. It calls the same `ValidateLogin` API as #1 and returns the `PalLoginResponse` as JSON, or an empty body on failure.

---

## 3–4. Login / auth (views)

`GET /Onboarding/Auth/Login?instance=MACM` and `GET /Onboarding/Auth/auth?instance=MACM`

These set the site instance (`MACM` / `MASK`), generate a 6-character captcha into session `GeneratedCaptcha` and return the view. No downstream call.

---

## 5. Authenticateuser

`POST /Onboarding/Auth/Authenticateuser` (form/query parameters). Anti-forgery is required.

### Controller request

| Param | Type |
|---|---|
| `username` | string |
| `password` | string |

### Downstream call 1: LoginValidate

```
POST {baseurl}OpenAccountService/api/v1.0/Admin/LoginValidate
Authorization: Bearer <OpenAccountService token>
```

```json
{ "loginName": "<username>", "password": "<password>" }
```

Response: encrypted envelope. Decrypted payload is `List<LoginInfo>`:

```json
[{
  "loginid": "", "loginname": "", "empid": 0, "emp_code": "", "empname": "",
  "mobile_no": "", "branch_id": 0, "branch_type_code": "", "branch_code": ""
}]
```

Error (non-2xx): `{ "Message": "...", "Description": "..." }`

### Downstream call 2: Send OTP (see #6)

```json
{ "OTPChannel": "Mobile", "MobileNumber": "<mobile_no>", "EmailID": "", "SessionID": "-1" }
```

### Controller response

Session set: `loginid`, `mobileno`, `OTPID`.

| Case | HTTP | Body |
|---|---|---|
| Missing username/password | 400 | `{ "success": false, "message": "Username and password are required." }` |
| Token failure | 401 | `{ "success": false, "message": "Invalid credentials or authentication failed." }` |
| LoginValidate non-2xx | same as downstream | `{ "success": false, "message": "<Message>", "description": "<Description>" }` |
| Empty login info | 401 | `{ "success": false, "message": "Invalid login information received." }` |
| OK + OTP sent | 200 | `{ "success": true, "message": "User authenticated successfully.", "description": "Login Successful", "loginid": "...", "mobileno": "..." }` |
| OK, OTP failed | 200 | `{ "success": false, "message": "User authentication completed but OTP sending failed.", "description": "...", "loginid": "...", "mobileno": "..." }` |
| Exception | 500 | `{ "success": false, "message": "Error authenticating user: <ex>" }` |

---

## 6. SendOtpAsync

`POST /Onboarding/Auth/SendOtpAsync`, bound to `OtpRequestmodel` (form fields). **No anti-forgery check.**

### Controller / downstream request

```
POST {baseurl}UtilityService/OTP/v2/Send
Authorization: Bearer <UtilityService token>
```

```json
{ "OTPChannel": "Mobile", "MobileNumber": "9999999999", "EmailID": "", "SessionID": "-1" }
```

### Downstream response

```json
{ "Message": "Success", "Data": { "OTPID": "abc123" }, "Description": "" }
```

### Controller response (always HTTP 200)

```json
{ "success": true, "message": "OTP sent successfully.", "response": { "Message": "Success", "Data": { "OTPID": "abc123" }, "Description": "" } }
```

```json
{ "success": false, "message": "Failed to send OTP.", "details": "<raw downstream body>" }
```

```json
{ "success": false, "message": "Invalid credentials or authentication failed." }
```

---

## 7. getuserdetailsaftervalidate

`POST /Onboarding/Auth/getuserdetailsaftervalidate?loginid=<id>`. No anti-forgery check.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/Admin/FetchLoginDetails
Authorization: Bearer <OpenAccountService token>
```

```json
{ "loginid": "<loginid>" }
```

Response: encrypted envelope. Decrypted payload is `List<Loginresponsemodel>` (all strings):

```json
[{ "loginid": "", "loginname": "", "empid": "", "emp_code": "", "empname": "",
   "mobile_no": "", "branch_id": "", "branch_type_code": "", "branch_code": "" }]
```

### Controller response (HTTP 200)

Session set: `branchId`, `empId`, `empcode`, `branchCode`, `branchTypeCode`, `LoginTime`, `empname`.

```json
{ "success": true, "message": "User details fetched successfully.", "response": [ { "loginid": "..." } ] }
```

Failures return `{ "success": false, "message": "Invalid login ID." | "Token generation failed." | "Failed to fetch login details." | "No user details found." | "Decryption failed or invalid data." | "Error fetching user details: <ex>" }`.

---

## 8. verifyotp

`POST /Onboarding/Auth/verifyotp` with `Content-Type: application/json`. No anti-forgery check.

### Controller request

```json
{ "OTPToCheck": "123456" }
```

### Downstream

```
POST {baseurl}UtilityService/OTP/v2/Verify
Authorization: Bearer <UtilityService token>
```

```json
{ "SessionID": "", "OTPID": "<session OTPID>", "OTPToCheck": "123456" }
```

Response (`VerifyOtpResponseModel`):

```json
{ "Message": "Success", "Data": { "SessionID": "", "OTP_ID": "" }, "Description": "" }
```

On `Message == "Success"` the action internally calls **#7 getuserdetailsaftervalidate** with the session `loginid`, which populates the employee session.

### Controller response (HTTP 200)

```json
{ "success": true, "message": "OTP verified successfully." }
```

```json
{ "success": false, "message": "Invalid OTP entered. Please try again." }
```

```json
{ "success": false, "message": "<downstream Message>", "details": "<downstream Description>" }
```

---

## 9. verifyOTPforforgetpassword (POST, JSON body)

`POST /Onboarding/Auth/verifyOTPforforgetpassword`

```json
{ "loginid": "", "otp": "223344" }
```

No downstream call. The OTP is compared against the **hard-coded** value `"223344"`. On success it sets the session to fixed values (`branchId=9999`, `empId=2286`, `empcode=6Lucas`) and returns `{ "success": true }`. Otherwise it returns `"Invalid or expired OTP"` / `"OTP is required"` as a JSON string.

> ⚠ Test stub: this lets anyone who knows the constant create a logged-in session. Remove it before production.

---

## 10. Logout

`POST /Onboarding/Auth/Logout`

Clears the session. Response: `{ "success": true, "message": "Logout successful" }`. On exception it returns 500: `{ "success": false, "message": "An error occurred during logout." }`.

> The anti-forgery call is **not awaited**, so the token is never actually enforced.

---

## 11. ValidateCaptcha

`POST /Onboarding/Auth/ValidateCaptcha?userInput=AbC123`

Compares the input with session `GeneratedCaptcha`.

```json
{ "success": true, "message": "✅ Correct captcha!" }
```

```json
{ "success": false, "message": "❌ Incorrect captcha, try again." }
```

---

## 12, 15, 16, 19. Views

| Action | Query | Notes |
|---|---|---|
| `ForgetPassword` | `instance` | Generates captcha |
| `ValidateOTP` | `senduserid`, `instance` | `ViewBag.userid` |
| `ValidateOTPforLogin` | `senduserid`, `instance` | Redirects to Login if session `loginid` is empty, otherwise exposes `loginid` / `mobileno` |
| `resetpassword` | `senduserid`, `instance` | `ViewBag.userid` |

---

## 13. getDataforforgetpassword

`GET /Onboarding/Auth/getDataforforgetpassword?emailid=user@x.com`

### Downstream (no bearer token)

```
GET {baseurl}Forgetpassword/getDataforforgetpassword?emailid=<trimmed email>
```

Response: `List<UserMasterViewModel>`

```json
[{ "SrNo": 1, "UserId": 10, "UserName": "", "Password": "", "EmailId": "", "Mobile": "",
   "RoleId": 1, "EmpCode": "", "BranchCode": "", "Designation": "", "BranchLocation": "",
   "IsActive": 1, "AllowDownloadData": 0, "MASK_Access": 1, "MACM_Access": 1,
   "CreatedOn": "", "CreatedBy": 1, "Role": "", "Flag": "", "Unmaskpi": 0, "FullName": "" }]
```

### Controller response

The same list is passed through. On non-2xx it returns `"False"`, and on exception `""`.

---

## 14. SendOTPmailforResetPassword

`GET /Onboarding/Auth/SendOTPmailforResetPassword?userid=10&emailid=user@x.com`

Downstream (no token): `GET {baseurl}Forgetpassword/sendOTPforforgetpassword?userid=&emailid=`. The response is a JSON string.

Controller: passes the string through. On non-2xx it returns **401** `{ "errorMessage": "Server error during authentication" }`, and on exception `""`.

---

## 17. verifyOTPforforgetpassword (GET)

`GET /Onboarding/Auth/verifyOTPforforgetpassword?userid=10&otp=123456&instance=`

Downstream (no token): `GET {baseurl}Forgetpassword/verifyOTPforgetpassword?userid=&otp=`

Controller: returns the raw downstream body as a JSON string. On non-2xx it returns `"False"`, and on exception `""`.

---

## 18. getdatabyuserid

`GET /Onboarding/Auth/getdatabyuserid?userid=10`

Downstream (no token): `GET {baseurl}Forgetpassword/Get_UserDatabyuserID?userid=`. The response is `List<UserMasterViewModel>` (see #13).

Controller: passes the list through. It returns `"False"` / `""` on failure.

---

## 20. SetResetpassword

`GET /Onboarding/Auth/SetResetpassword?userid=10&resetpassword=NewP@ss1`

Downstream (no token): `GET {baseurl}Forgetpassword/setResetpassword?userid=&resetpassword=`

Controller: returns the raw downstream body as a JSON string, or `"False"` / `""`.

> ⚠ The new password travels in the query string (it gets logged by proxies and servers) and the downstream call has no authentication.

---

## 21. ValidatePassword

`POST /Onboarding/Auth/ValidatePassword?password=...`

No downstream call. Rules: at least 8 characters, 1 uppercase letter, 1 digit and 1 special character.

```json
{ "isValid": false, "message": "Password must contain at least one number." }
```

---

## Observations

* `SendOtpAsync`, `getuserdetailsaftervalidate`, `verifyotp` and `GetPalLoginStatusAsync` are publicly routable without anti-forgery or session checks.
* `Forgetpassword/*` downstream calls send no bearer token.
* `verifyOTPforforgetpassword` (POST) contains a hard-coded OTP and session values.
