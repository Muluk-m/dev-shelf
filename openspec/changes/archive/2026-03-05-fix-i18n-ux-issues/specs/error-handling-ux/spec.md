## ADDED Requirements

### Requirement: User-friendly error messages for network failures
The system SHALL display translated, human-readable error messages when API requests fail due to network issues (offline, DNS failure, timeout) instead of raw browser error text.

#### Scenario: Network is offline during login
- **WHEN** the user submits the login form while the network is unavailable
- **THEN** the error message SHALL display a translated message like "Network error, please check your connection" instead of a raw TypeError

#### Scenario: Network is offline during registration
- **WHEN** the user submits the registration form while the network is unavailable
- **THEN** the error message SHALL display the same translated network error message

### Requirement: User-friendly error messages for server errors
The system SHALL map common HTTP error status codes to translated, user-friendly messages instead of showing raw status codes or generic "failed" text.

#### Scenario: Server returns 502 during login
- **WHEN** the API returns HTTP 502
- **THEN** the error message SHALL display a translated message like "Server is temporarily unavailable, please try again later"

#### Scenario: Server returns 401 during login
- **WHEN** the API returns HTTP 401 with no specific error body
- **THEN** the error message SHALL display a translated "Invalid username or password" message

#### Scenario: Server returns 500
- **WHEN** the API returns HTTP 500
- **THEN** the error message SHALL display a translated "Server error, please try again later" message

### Requirement: Centralized error message helper
The API module SHALL provide a centralized error mapping function that all API functions use, so error message logic is not duplicated across components.

#### Scenario: Error helper is used by login API
- **WHEN** the `login()` function catches a non-OK response
- **THEN** it SHALL use the centralized error helper to produce the error message

#### Scenario: Error helper is used by register API
- **WHEN** the `register()` function catches a non-OK response
- **THEN** it SHALL use the centralized error helper to produce the error message

### Requirement: Error messages use i18n
All error messages produced by the centralized error helper SHALL use i18n translation keys so they appear in the user's selected language.

#### Scenario: Error message in Chinese mode
- **WHEN** the locale is set to zh-CN and a network error occurs
- **THEN** the error message SHALL appear in Chinese

#### Scenario: Error message in English mode
- **WHEN** the locale is set to en and a network error occurs
- **THEN** the error message SHALL appear in English
