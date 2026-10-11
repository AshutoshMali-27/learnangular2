# Customer Face-Liveliness Page (`capturedetails`)

| Item | Value |
|---|---|
| URL | `GET /Onboarding/nriaccountopening2/capturedetails?q=<AES-GCM cipher>.<IV>` – the link the **customer** receives by email |
| Controller action | `nriaccountopening2Controller.capturedetails` (no login; decrypts `q` into `{FormNo, SkRefNo, PANNumber, HolderType}`) |
| View | `Views/nriaccountopening2/capturedetails.cshtml` (`Layout = null`, standalone page) |
| Script | `wwwroot/pages/liveliness-sdk.js` |
| Third-party | **AiNxt** liveliness SDK (`LivelinessSDKConfig:ScriptUrl`, token API `LivelinessSDKConfig:ApiUrl`) |

## 1. Purpose

A public page where the customer completes a **face liveliness (selfie) check** with their camera. The result and the cropped face image are saved against the form / holder.

## 2. Page elements

| Element | Purpose |
|---|---|
| `#livelinessConfig` (data attributes) | SDK config from server: `script-url`, `client-key`, `api-url`, `api-key`, `redirect-url`, `ref-id` |
| hidden `lblskrefno`, `lblformno`, `lblpanno`, `lblholdertype` | Values decrypted from `q` |
| Info alert | "The SDK will initialize automatically… ensure your camera is enabled and you're in a well-lit environment." |
| **Start Face Verification** (`#init-sdk-btn`) | Starts / retries the scan |
| `#loading-spinner` | "Initializing SDK…" overlay |
| `#alert-container` | Success / Error / Warning messages |
| `#sdk-response-container` | Result card: status badge, Status, Remark, Unique ID |

There are no form inputs. The only user action is the button. Camera, microphone and geolocation permissions are requested (meta `Permissions-Policy`).

## 3. Flow

```
page load ──(500 ms)──► LivelinessSDK.init()   (also on button click)
  1. loadSDKScript()   → injects <script src=ScriptUrl>, waits for window.AinxtSDK
  2. fetchToken()      → POST {ApiUrl}?RefId=&Redirect_url=&client_key=   header x-api-key: ApiKey  → { Token }
  3. AinxtSDK.Initialize(token, success, error)  → SDK UI runs the face scan
  4. success(data) → displaySDKResponse(data)
        POST /Onboarding/ExtraDetails/SaveSDKImage  (JSON, see below)
        200 → button disabled, "VALID – Face Scan Successful", "Face validation successful!"
        error → red badge with server description, "Face validation failed: <remark>"
```

Errors are mapped to friendly messages for missing camera / microphone / geolocation permission, script-load failure and permissions-policy violations.

## 4. Save payload → `POST /Onboarding/ExtraDetails/SaveSDKImage` (no anti-forgery)

```json
{
  "formentryid": "<skrefno>", "formno": "<formNo>", "panNo": "<PAN>", "holderType": "TRD",
  "isValid": true, "remark": "", "uniqueId": "", "live": "", "livenessScore": "",
  "datetime": "", "requestId": "", "city": "", "state": "", "country": "",
  "latitude": "", "longitude": "", "ageRange": "", "gender": "",
  "allowException": false, "croppedImageBase64": "data:image/jpeg;base64,..."
}
```

SDK response field → payload: `is_valid`→`isValid`, `remark`, `Unique_Id`→`uniqueId`, `Live`, `LivenessScore`, `Datetime`, `RequestId`, `security_City/State/Country/Latitude/Longitude`, `age_range`, `gender`, `allowexception`, `cropped_image`.

The server stores the image under the form folder and calls `SaveLivelinessDetails` (see API doc).

## 5. Known issues / security

1. `SaveSDKImage` is called **twice** for one scan (two identical AJAX calls in `displaySDKResponse`).
2. The third-party `ApiKey` and `ClientKey` are exposed to the browser in data attributes.
3. A malformed `q` parameter crashes the server action (unhandled exception).
4. `isValid` is computed but the UI success depends only on the server save succeeding, not on `is_valid`.

## 6. React migration notes

A standalone public route (outside the employee layout) with a `useLivelinessSdk()` hook wrapping script loading, token fetch and `Initialize`. The token should ideally be fetched through a backend proxy so the API key stays server-side.
