# ErrorController

**File:** `Controllers/ErrorController.cs`  
**Purpose:** Status-code error pages.

**This controller consumes no downstream APIs.**

## Error

`GET /Error/{statusCode}`. Attribute-routed, so there is **no** `/Onboarding` prefix.

| `statusCode` | View returned |
|---|---|
| 404 | `Views/Error/NotFound.cshtml` |
| 403 | `Unauthorized` → `Views/Error/unauthorized.cshtml` |
| anything else | `Error` → no `Views/Error/Error.cshtml` exists, so MVC falls back to `Views/Shared/Error.cshtml` |

Response: HTML.

> The view is named `Unauthorized` but the file is `unauthorized.cshtml`. That works on Windows, which has case-insensitive file names, but the view will not be found on a case-sensitive Linux host.
