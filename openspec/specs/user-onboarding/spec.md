# user-onboarding Specification

## Purpose

Ensures every account has a unique username before it can be used elsewhere in the app, by requiring a one-time onboarding step right after an account is created.

## Requirements

### Requirement: New accounts start without a username
The system SHALL create an account's profile without a username at signup time, regardless of whether the account was created via email+password or an OAuth provider.

#### Scenario: Profile created at signup has no username
- **WHEN** a new account is created through any supported sign-up method
- **THEN** the resulting profile has no username set

### Requirement: Signup redirects to onboarding
The system SHALL redirect a user to the onboarding page immediately after they complete sign up, before they reach any other page.

#### Scenario: Redirect after email+password signup
- **WHEN** a visitor completes sign up with email and password
- **THEN** they are redirected to the onboarding page

#### Scenario: Redirect after OAuth signup
- **WHEN** a visitor completes sign up via an OAuth provider for the first time
- **THEN** they are redirected to the onboarding page

### Requirement: Onboarding collects a unique username
The system SHALL require a signed-in user without a username to choose one on the onboarding page before proceeding, and SHALL reject a choice that is already taken by another account.

#### Scenario: Choosing an available username
- **WHEN** a user on the onboarding page submits a username that is not already in use
- **THEN** the username is saved to their profile and they proceed out of onboarding

#### Scenario: Choosing a username that is already taken
- **WHEN** a user on the onboarding page submits a username already used by another account
- **THEN** the system rejects the submission and displays an error, leaving their profile without a username

### Requirement: Missing username redirects to onboarding
The system SHALL redirect a signed-in user without a username to the onboarding page whenever they attempt to visit a page that requires one, rather than showing that page's content.

#### Scenario: Visiting the profile page without a username
- **WHEN** a signed-in user with no username set navigates to the profile page
- **THEN** they are redirected to the onboarding page instead of seeing the profile page

#### Scenario: Onboarding is a no-op once a username is set
- **WHEN** a signed-in user who already has a username navigates to the onboarding page
- **THEN** they are not asked to choose a username again
