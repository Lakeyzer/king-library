## MODIFIED Requirements

### Requirement: Sign out
The system SHALL allow a signed-in user to sign out, ending their session, and SHALL show a farewell message reading "Long days and pleasant nights" (the Gilead greeting from the Dark Tower series) as part of signing out.

#### Scenario: Signing out
- **WHEN** a signed-in user activates sign out
- **THEN** their session ends and subsequent page loads treat them as signed out

#### Scenario: Farewell message on sign out
- **WHEN** a signed-in user activates sign out
- **THEN** the message "Long days and pleasant nights" is shown
