# Login and OTP (`Auth/Login`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/Auth/Login?instance=MACM|MASK` (default route) |
| View | `Views/Auth/Login.cshtml` (own layout – no sidebar) |
| Scripts | `thememanager.js`, `login.js`, `validateotpforpassword.js` |
| Server APIs | [AuthController.md](../API/AuthController.md) |

There are two ways to log in:

1. **Username / password + OTP** – this page (UI flow below).
2. **PAL / PowerAdmin SSO** – an external system POSTs `Un`, `SecKey`, `Code` (form) to `/Onboarding/Auth/Login`. The server validates and redirects to the dashboard. No UI is involved.

## 1. Panels

### Login panel (`#pnllogin`)

| # | Label | Id | Control | Rules |
|---|---|---|---|---|
| 1 | User ID | `userId` | text | Allowed `a-z A-Z 0-9 @ .`; copy blocked; Enter → focus password |
| 2 | Password | `password` | password | Spaces stripped; cut blocked; Caps-Lock warning; eye toggle (`togglePassword`); Enter → focus Login |
| 3 | Captcha | `#captchaImage` (6 random letters/digits, generated **client-side**) + `captchaInput` | text | Alphanumeric; copy / paste / cut blocked; ↻ regenerates |
| 4 | Login | `loginBtn` | button | Shows "Logging In…" while busy |
| – | Blocked-user notice | `div_blockUserNotification` / `lbl_blockUserNotification` | | |

Header: dark-mode toggle and theme picker (same `ThemeManager` as the main layout, persisted in `localStorage`).

### OTP panel (`#pnlotp`, hidden initially)

| Element | Id | Behaviour |
|---|---|---|
| Masked mobile | `maskedmobile` | `XXXXXXX123` (last 3 digits shown) |
| 6 OTP boxes | `otp-1` … `otp-6` (`.otp-input`) | Digits only, auto-advance, Backspace moves back, pasting a 6-digit code fills all boxes |
| Countdown | `timer` | 5:00 "Resend in: m:ss sec"; at 0 it is replaced by a **Resend OTP** link and Verify is disabled |
| Verify | `verifyBtn` (`.verify-btn`) | Validates all 6 digits are filled |

## 2. Flow

```
Login click
  ├ user id / password empty → error, form cleared
  ├ captcha empty / mismatch (compared in the browser) → error, new captcha
  └ POST /Onboarding/Auth/Authenticateuser  (form: username, password; anti-forgery header)
        server: LoginValidate → sends OTP to the registered mobile → session loginid / OTPID
        success → hide login, show OTP panel, start 5-min timer, show masked mobile
        success:false (OTP send failed) → error popup **and** the OTP panel is still shown
        HTTP error → error popup with `description`, form cleared
Verify click
  └ POST /Onboarding/Auth/verifyotp  JSON { OTPToCheck: "123456" }
        success → server sets the employee session → redirect /Onboarding/Home/Index
        else    → "Invalid OTP", boxes cleared
```

Other behaviour: on load the page clears **all cookies** and the `userId` / `PassWord` local-storage keys; back navigation is blocked (`history.forward()`).

## 3. Known issues

1. The captcha is generated and checked only in the browser (the server's `GeneratedCaptcha` session value and `ValidateCaptcha` endpoint are not used), so it offers no protection.
2. **Resend OTP** does not call the server. It only shows "OTP Resent to your Email ID and Mobile No" and restarts the timer.
3. When OTP sending fails, the OTP panel is still shown.
4. `togglePassword` is defined twice.
5. Clearing all cookies on load also removes the anti-forgery cookie until the page re-issues it.

## 4. React migration notes

* Public route `/login` with `<CredentialsStep>` → `<OtpStep>` state machine.
* Server-generated captcha (image) validated on the server.
* `<OtpInput length={6} />` component. Implement real resend via `Auth/SendOtpAsync` (or a dedicated resend endpoint).
* After the OTP succeeds, read the user profile (name, branch type) for the app shell.
