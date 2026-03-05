## ADDED Requirements

### Requirement: All UI strings in translation files
The system SHALL have every visible UI string (labels, buttons, placeholders, error messages, tooltips) in both `locales/zh-CN.json` and `locales/en.json`. No hardcoded Chinese or English strings SHALL remain in component JSX.

#### Scenario: Tool page renders in English
- **WHEN** locale is `"en"` AND user navigates to any built-in tool page
- **THEN** all UI text (tab labels, button labels, placeholders, section headings) SHALL display in English

#### Scenario: Tool page renders in Chinese
- **WHEN** locale is `"zh-CN"` AND user navigates to any built-in tool page
- **THEN** all UI text SHALL display in Chinese

#### Scenario: Auth pages translated
- **WHEN** locale is `"en"` AND user views login or register page
- **THEN** form labels, button text, and error messages SHALL be in English

#### Scenario: Admin pages translated
- **WHEN** locale is `"en"` AND user views admin tools or permissions page
- **THEN** table headers, action buttons, and dialog text SHALL be in English

### Requirement: Translation key naming convention
Translation keys SHALL follow the pattern `<area>.<component>.<description>` (e.g., `tools.jsonFormatter.tabs.format`). Keys SHALL be grouped by page/area at the top level in the JSON files.

#### Scenario: Consistent key structure
- **WHEN** a developer adds a new translation key
- **THEN** the key SHALL follow `<area>.<component>.<description>` naming with no deeply nested objects beyond 3 levels

### Requirement: useTranslation replaces useI18n
All components that previously used `useI18n()` SHALL be updated to use `useTranslation()` from react-i18next. The `t()` call signature SHALL remain `t("key")` or `t("key", { var: value })`.

#### Scenario: Hook replacement
- **WHEN** a component calls `const { t } = useTranslation()`
- **THEN** `t("some.key")` SHALL return the correct string for current locale

#### Scenario: Variable interpolation
- **WHEN** a translation string contains `{{variable}}` placeholders
- **THEN** `t("key", { variable: "value" })` SHALL return the string with the placeholder replaced

### Requirement: Old custom i18n removed
The files `app/hooks/use-i18n.ts` and `app/i18n/translations.ts` SHALL be deleted after all usages are replaced with react-i18next.

#### Scenario: No import of old hook
- **WHEN** codebase is searched for `use-i18n` or `useI18n`
- **THEN** no results SHALL be found in application source files
