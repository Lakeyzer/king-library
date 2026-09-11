## ADDED Requirements

### Requirement: Live username availability feedback
The system SHALL check, as a user types a candidate username on the onboarding page, whether that username is already taken by another account (matched case-insensitively), and SHALL indicate the result to the user before they submit the form.

#### Scenario: Typing a username that is already taken
- **WHEN** a user on the onboarding page types a username already used by another account
- **THEN** the page indicates the username is taken before the user submits the form

#### Scenario: Typing a username that is available
- **WHEN** a user on the onboarding page types a username not used by any account
- **THEN** the page indicates the username is available before the user submits the form

## MODIFIED Requirements

### Requirement: Onboarding collects a unique username
The system SHALL require a signed-in user without a username to choose one on the onboarding page before proceeding, SHALL allow uppercase and lowercase letters (in addition to digits and underscores) in the chosen username, and SHALL reject a choice that is already taken by another account, matching case-insensitively so that usernames differing only in letter case are treated as the same name.

#### Scenario: Choosing an available username
- **WHEN** a user on the onboarding page submits a username that is not already in use
- **THEN** the username is saved to their profile, with the letter case they chose preserved, and they proceed out of onboarding

#### Scenario: Choosing a username that is already taken
- **WHEN** a user on the onboarding page submits a username already used by another account
- **THEN** the system rejects the submission and displays an error, leaving their profile without a username

#### Scenario: Choosing a username that differs only in letter case from one already taken
- **WHEN** a user on the onboarding page submits a username that matches an existing account's username except for letter case
- **THEN** the system rejects the submission as already taken, the same as an exact-case match
