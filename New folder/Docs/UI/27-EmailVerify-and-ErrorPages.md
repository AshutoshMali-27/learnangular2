# Email Verification Result and Error Pages

## 1. Email verification result (`Email/verify`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/Email/verify?src=<encrypted serial no>` – the link in the verification mail sent by `CheckEmail` / `SendVerificationMail` |
| View | `Views/Email/verify.cshtml` (`Layout = null`, standalone) |
| Script | none |
| Server | [EmailController.md](../API/EmailController.md) – decrypts `src` and calls `NRI/VerifyEmail` |

A static result page with no inputs:

| ViewBag | Shown as |
|---|---|
| `result` | `200` → ✔ icon, `500` → ✖ icon |
| `title` | Page `<title>` and heading (e.g. the server `Data` "Email Verified Successfully!") |
| `message` | Body text ("Your email address has been successfully verified…" or the failure reason) |

Customers must verify their email before the liveliness link can be sent (see [19-SendLivelinessNotification.md](19-SendLivelinessNotification.md)).

**React:** public route `/verify-email?src=` that calls an API returning `{ success, title, message }`.

## 2. Error pages

| Page | URL / trigger | View | Content |
|---|---|---|---|
| Not Found | `/Error/404` | `Views/Error/NotFound.cshtml` | "404 – Page not found. This page went missing." |
| Unauthorized | `/Error/403` | `Views/Error/unauthorized.cshtml` | 403 message |
| Generic error | `/Error/{other}` or `Home/Error` | `Views/Shared/Error.cshtml` (default ASP.NET template) | "An error occurred while processing your request." + Request ID |

These pages have no inputs and no scripts.

## 3. Views referenced by actions but missing

`AuthController` returns views that do **not exist** in `Views/Auth`: `auth`, `ForgetPassword`, `ValidateOTP`, `ValidateOTPforLogin`, `resetpassword`. The forgot-password flow therefore has no UI in this project; only `Login.cshtml` exists. Decide during migration whether to build these screens or drop the endpoints.
