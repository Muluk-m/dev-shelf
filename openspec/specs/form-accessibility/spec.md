## ADDED Requirements

### Requirement: Password strength hint on registration
The registration form SHALL display a static hint below the password field showing password requirements before the user attempts to submit.

#### Scenario: User sees password hint
- **WHEN** the registration form is rendered
- **THEN** a hint text SHALL be visible below the password input stating the minimum length requirement (8 characters)

#### Scenario: Password hint is translated
- **WHEN** the locale is switched from en to zh-CN
- **THEN** the password hint text SHALL update to Chinese

### Requirement: Language toggle with icon
The language toggle button SHALL include a Globe icon alongside the text label to improve discoverability.

#### Scenario: Toggle displays icon and text
- **WHEN** the language toggle is rendered
- **THEN** it SHALL show a Globe icon followed by the text "EN" or "中文"

### Requirement: Dynamic locale-aware page titles
Each route page SHALL update `document.title` dynamically when the user switches language, using translated title strings.

#### Scenario: Login page title in Chinese
- **WHEN** the user is on the login page and locale is zh-CN
- **THEN** `document.title` SHALL be "登录 | DevShelf"

#### Scenario: Login page title in English
- **WHEN** the user is on the login page and locale is en
- **THEN** `document.title` SHALL be "Login | DevShelf"

#### Scenario: Title updates on language switch
- **WHEN** the user switches language while on any page
- **THEN** `document.title` SHALL update to the new locale's translated title
