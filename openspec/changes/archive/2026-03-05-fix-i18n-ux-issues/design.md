## Context

The DevShelf project recently migrated to react-i18next for i18n support. A new-user walkthrough revealed several remaining UX issues:

- API error messages bubble up raw text (e.g., "Request failed, status code: 502") instead of user-friendly messages
- Route `meta()` functions use hardcoded English titles (e.g., `"Login | DevShelf"`) instead of locale-aware titles
- No password strength hint is shown on registration before the user submits
- The language toggle button could be more discoverable with an icon

**Current state**: Login/register are already separate routes, form labels/autocomplete/password confirmation are already in place, placeholder text is already translated, and brand name is unified as "DevShelf".

## Goals / Non-Goals

**Goals:**
- Improve API error handling so network failures and server errors show translated, human-readable messages
- Make route `<title>` elements locale-aware so they update when the user switches language
- Add a password strength hint below the password field on registration
- Enhance language toggle with a Globe icon for better discoverability

**Non-Goals:**
- Backend changes (all fixes are frontend-only)
- Adding new routes or restructuring the routing system (login/register are already separate)
- Reworking the i18n infrastructure (react-i18next is already set up)
- Adding form accessibility attributes (labels, autocomplete already present)

## Decisions

### 1. API error message handling

**Decision**: Add a helper function `getErrorMessage(error, fallbackKey)` in `app/lib/api.ts` that:
- Catches `TypeError` from `fetch()` (network offline) → returns a translated "network error" message
- Detects HTTP status-based errors → maps common status codes (401, 403, 500, 502, 503) to translated messages
- Falls back to the server-provided message if it's present and not a raw status string

**Rationale**: Centralizing error mapping avoids duplicating logic across every form component. Since `api.ts` runs outside React context, we import `i18next` directly (not via hook) to access `t()`.

**Alternative considered**: Mapping errors in each component's catch block — rejected because it leads to duplicated switch/case logic across 5+ forms.

### 2. Dynamic route titles

**Decision**: Use `useEffect` in page components to update `document.title` with translated text when locale changes, rather than relying on the static `meta()` export.

**Rationale**: React Router v7's `meta()` function runs at route evaluation time and cannot access React hooks. Using `useEffect` with `useTranslation` keeps titles reactive to language changes. We keep the static `meta()` as a fallback for SSR/crawlers.

**Alternative considered**: Custom `<DynamicTitle>` component — slightly over-engineered for this use case since a simple `useEffect` in each page achieves the same result.

### 3. Password strength hint

**Decision**: Add a static hint text below the password input on the register form using existing i18n keys, showing requirements like "At least 8 characters, mix of letters and numbers recommended".

**Rationale**: A full password strength meter (with color bars) is overkill for an internal tool platform. A simple text hint sets expectations before submission.

### 4. Language toggle enhancement

**Decision**: Add a `Globe` icon from lucide-react before the text label in `LanguageToggle`.

**Rationale**: Icons improve scannability. The Globe icon is the universal convention for language switching.

## Risks / Trade-offs

- **`document.title` via useEffect**: Title briefly shows the static English text before the effect runs on first render. Acceptable since the delay is imperceptible. → Mitigation: Keep static `meta()` with English text as baseline.
- **i18next import in api.ts**: Using `i18next.t()` outside React components means translations are only available after i18next initializes. → Mitigation: Provide English fallback strings in case i18next isn't ready.
