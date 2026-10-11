# EmailController

**File:** `Controllers/EmailController.cs`  
**Route prefix:** `/Onboarding/Email/{action}`  
**Purpose:** Landing page for the customer email-verification link (sent by `NRI/SendVerificationEmail`).

## Summary

| # | Action | HTTP | Downstream API |
|---|---|---|---|
| 1 | `verify` | GET | `OpenAccountService/api/v1/NRI/VerifyEmail` |

---

## 1. verify

`GET /Onboarding/Email/verify?src=<base64 cipher text>`

* No session or anti-forgery check: this is a public link opened from the customer's mailbox.
* `src` is decrypted with AES-GCM using `Account:AESKey` and the **static** IV `AppSettings:IV`. Spaces are turned back into `+` first. The plaintext is the **serial number** of the verification request.

### Downstream

```
POST {baseurl}OpenAccountService/api/v1/NRI/VerifyEmail
Authorization: Bearer <OpenAccountService token>
```

```json
{ "SerialNo": "<decrypted serial no>" }
```

Response (`VerifyEmailResponseModel`):

```json
{ "Message": "Success", "Data": "Email Verified Successfully!", "Description": "" }
```

### Controller response

An HTML view (`Views/Email/verify.cshtml`) with:

| ViewBag | Success | Failure |
|---|---|---|
| `result` | `200` | `500` |
| `title` | downstream `Data` | downstream `Data`, or `"Email Verification Failed!"` / `"Email Verification Error!"` |
| `message` | `"Your email address has been successfully verified. You can now continue to your account."` | downstream `Message`, `"Invalid or corrupted verification link."` or `"An unexpected error occurred: <ex>"` |
