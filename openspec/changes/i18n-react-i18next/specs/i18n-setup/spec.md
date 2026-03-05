## ADDED Requirements

### Requirement: i18next initialization
The system SHALL initialize i18next with inline-imported JSON language packs before the React tree renders, using `i18next-browser-languagedetector` to read the `"locale"` key from localStorage.

#### Scenario: Initialize with stored locale
- **WHEN** user has `"locale": "en"` in localStorage
- **THEN** i18next SHALL load with `lng: "en"` immediately on first render

#### Scenario: Initialize with default locale
- **WHEN** no `"locale"` key exists in localStorage
- **THEN** i18next SHALL default to `"zh-CN"`

#### Scenario: Language switch persists
- **WHEN** user calls `setLocale("en")` via locale-store
- **THEN** i18next.changeLanguage("en") SHALL be called AND `"locale"` key in localStorage SHALL be updated to `"en"`

#### Scenario: React tree access to translations
- **WHEN** any component calls `useTranslation()` from react-i18next
- **THEN** the `t` function SHALL return the correct translated string for the current language

### Requirement: locale-store delegates to i18next
The system SHALL ensure `locale-store.setLocale(lang)` calls `i18next.changeLanguage(lang)` so that changing locale through any existing UI component (e.g., language-toggle) automatically updates all translations.

#### Scenario: Toggle triggers i18next update
- **WHEN** user clicks language toggle (EN/中文)
- **THEN** `setLocale` is called → i18next.changeLanguage is called → all `useTranslation()` consumers re-render with new language

### Requirement: I18nextProvider wraps app
The system SHALL wrap the React app in `I18nextProvider` (or equivalent initialization via `initReactI18next`) so that `useTranslation()` is available in all components without additional setup.

#### Scenario: No provider error
- **WHEN** any component uses `useTranslation()`
- **THEN** no "i18next instance not initialized" error SHALL occur
