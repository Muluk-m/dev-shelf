# Tool Management Specification Delta

## ADDED Requirements

### Requirement: AI Icon Generation
The system SHALL provide AI-powered icon generation functionality when creating or editing tools in the admin interface.

#### Scenario: User triggers AI icon generation
- **WHEN** user clicks the "AI 生成" button in the icon input field
- **THEN** the system generates an icon based on the tool's name and description
- **AND** displays a loading indicator during generation
- **AND** automatically fills the icon URL field with the generated icon

#### Scenario: AI generation succeeds
- **WHEN** the Dify API successfully generates an icon
- **THEN** the system receives the icon URL or base64 data
- **AND** updates the icon preview in the form
- **AND** shows a success toast notification

#### Scenario: AI generation fails
- **WHEN** the Dify API request fails (network error, API error, timeout)
- **THEN** the system displays an error toast notification with a clear message
- **AND** the icon URL field remains unchanged
- **AND** the user can retry the generation

#### Scenario: Generate icon without tool name
- **WHEN** user attempts to generate an icon without entering a tool name
- **THEN** the system shows a warning message
- **AND** prevents the API call until tool name is provided

### Requirement: AI Icon Generation API Integration
The system SHALL integrate with the Dify API service to generate icons.

#### Scenario: Call Dify API with tool context
- **WHEN** making an AI icon generation request
- **THEN** the system sends a POST request to `https://api-ai.qiliangjia.org/v1`
- **AND** includes the API key `app-w3ySSC6PLTlrjldSPErTwE6x` in the Authorization header
- **AND** provides tool name and description as generation context

#### Scenario: Handle API rate limiting
- **WHEN** the Dify API returns a rate limit error (429)
- **THEN** the system displays a friendly message asking the user to try again later
- **AND** disables the AI generation button temporarily

### Requirement: Icon Generation UI Enhancement
The tool form icon input area SHALL be enhanced with AI generation capability.

#### Scenario: Display AI generation button
- **WHEN** user views the icon input field in the tool form
- **THEN** an "AI 生成" button is displayed next to the icon URL input
- **AND** the button has a distinctive icon (e.g., Sparkles) to indicate AI functionality

#### Scenario: Show generation loading state
- **WHEN** AI icon generation is in progress
- **THEN** the "AI 生成" button shows a loading spinner
- **AND** the button is disabled to prevent duplicate requests
- **AND** the form submit button remains enabled

#### Scenario: Icon preview updates
- **WHEN** an icon is generated successfully
- **THEN** the icon preview box displays the new icon
- **AND** any previous icon preview is replaced
- **AND** the icon URL input field is updated with the new value
