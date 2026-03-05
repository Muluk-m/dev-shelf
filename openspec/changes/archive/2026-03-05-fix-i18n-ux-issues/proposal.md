## Why

The app was tested as a new user and multiple UX, i18n, and reliability issues were found. Placeholder text is not translated in Chinese mode, the brand name is inconsistent across pages ("Transweave" vs "i18n Platform" vs "i18n 平台"), error messages expose raw HTTP status codes, and forms lack accessibility attributes and basic UX patterns like password confirmation. These issues undermine the open-source quality bar for the project.

## What Changes

- Translate all form placeholder text for both zh-CN and en locales
- Unify brand name to a single consistent name throughout the app (page titles, subtitles, meta)
- Add user-friendly error messages for network/server failures instead of raw status codes
- Add `<label>` elements and `autocomplete` attributes to all form inputs for accessibility
- Add a "confirm password" field to the registration form
- Show password strength requirements on registration
- Differentiate page `<title>` per route (e.g., "Login | BrandName", "Register | BrandName")
- Make the language toggle button more discoverable with a text label
- Give login and register separate URL routes so users can share/bookmark them

## Capabilities

### New Capabilities
- `form-accessibility`: Add proper labels, autocomplete attributes, and password confirmation to auth forms
- `error-handling-ux`: Show user-friendly error messages for network failures and server errors
- `route-separation`: Separate login and register into distinct URL routes

### Modified Capabilities

## Impact

- **Frontend routes**: `login.tsx`, new `register.tsx` route (currently login/register share `/login`)
- **Components**: `login-form.tsx`, `register-form.tsx`, `language-toggle.tsx`
- **i18n translations**: `locales/zh-CN.json`, `locales/en.json` — new keys for placeholders, error messages, password hints
- **Layout**: `root.tsx` or layout component — per-route `<title>`
- **No backend changes required** — all fixes are frontend-only
