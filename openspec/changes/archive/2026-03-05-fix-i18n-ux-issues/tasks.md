## 1. Error Handling UX

- [x] 1.1 Add i18n keys for error messages (`error.network`, `error.serverUnavailable`, `error.serverError`, `error.unauthorized`, `error.forbidden`, `error.unknown`) to both `locales/zh-CN.json` and `locales/en.json`
- [x] 1.2 Create a centralized `getApiErrorMessage(error, fallbackKey)` helper in `app/lib/api.ts` that maps network errors (TypeError) and HTTP status codes (401, 403, 500, 502, 503) to i18n-translated messages using `i18next.t()` directly
- [x] 1.3 Update `login()`, `register()`, `changePassword()`, `updateProfile()`, and `initializeSetup()` in `app/lib/api.ts` to use the new error helper

## 2. Form UX Improvements

- [x] 2.1 Add password strength hint i18n keys (`auth.register.passwordHint`) to both locale files
- [x] 2.2 Add a hint text element below the password input in `app/components/auth/register-form.tsx` using the new i18n key

## 3. Language Toggle Enhancement

- [x] 3.1 Add `Globe` icon import from lucide-react and render it before the text label in `app/components/language-toggle.tsx`

## 4. Dynamic Page Titles

- [x] 4.1 Create a `useDocumentTitle(titleKey)` hook in `app/hooks/use-document-title.ts` that uses `useTranslation` + `useEffect` to set `document.title`
- [x] 4.2 Add `useDocumentTitle` to `app/routes/login.tsx`, `app/routes/register.tsx`, `app/routes/setup.tsx`, `app/routes/settings.tsx`, `app/routes/admin.tsx`, and `app/routes/_index.tsx`
