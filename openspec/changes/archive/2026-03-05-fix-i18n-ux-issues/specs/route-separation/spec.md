## ADDED Requirements

### Requirement: Login and register are separate URL routes
The login page SHALL be accessible at `/login` and the registration page at `/register`, each as distinct URL routes that can be bookmarked and shared.

#### Scenario: User navigates to /login
- **WHEN** a user visits `/login`
- **THEN** the login form SHALL be displayed

#### Scenario: User navigates to /register
- **WHEN** a user visits `/register`
- **THEN** the registration form SHALL be displayed

#### Scenario: Cross-linking between login and register
- **WHEN** a user is on the login page and clicks the "Register" link
- **THEN** the browser SHALL navigate to `/register`
