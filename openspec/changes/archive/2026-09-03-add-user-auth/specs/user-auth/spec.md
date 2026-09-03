## Purpose

Lets a visitor create an account and sign in, via email+password or a third-party OAuth provider, so that user-specific features (collections, wishlists, profiles) have an authenticated identity to attach to.

## ADDED Requirements

### Requirement: Sign up and sign in are presented in a modal auth form
The system SHALL present sign up and sign in as a single `UAuthForm` component rendered inside a `UModal`, reachable from the header, without navigating away from the current page.

#### Scenario: Opening the auth modal
- **WHEN** a signed-out visitor activates the header's sign-in entry point
- **THEN** a modal opens containing the auth form, and the page behind it remains unchanged

#### Scenario: Auth modal offers both sign up and sign in
- **WHEN** the auth modal is open
- **THEN** the visitor can switch between a sign-up mode and a sign-in mode within the same modal

### Requirement: Email and password authentication
The system SHALL allow a visitor to sign up and sign in using an email address and password.

#### Scenario: Signing up with email and password
- **WHEN** a visitor submits a new email address and a password through the auth form's sign-up mode
- **THEN** an account is created and the visitor becomes signed in

#### Scenario: Signing in with email and password
- **WHEN** a visitor submits a registered email address and its correct password through the auth form's sign-in mode
- **THEN** the visitor becomes signed in

#### Scenario: Incorrect credentials
- **WHEN** a visitor submits an email and password that do not match a registered account
- **THEN** the system rejects the attempt and displays an error in the auth form without signing the visitor in

### Requirement: OAuth authentication
The system SHALL allow a visitor to sign up and sign in using Google or Discord as an identity provider, in addition to email+password.

#### Scenario: Signing in with an OAuth provider
- **WHEN** a visitor selects Google or Discord in the auth form and completes that provider's authorization flow
- **THEN** the visitor becomes signed in, using an existing account if one is already linked to that provider identity, or a newly created one otherwise

#### Scenario: OAuth provider not yet configured
- **WHEN** an OAuth provider is selected that has not been enabled/configured for this app
- **THEN** the system does not silently fail; the visitor sees an error rather than a broken redirect

### Requirement: Session works correctly under server-side rendering
The system SHALL make the signed-in/signed-out state available during server-side rendering, so that a page's initial render (not just a client-side hydration pass) reflects whether the visitor is authenticated.

#### Scenario: Requesting a page while already signed in
- **WHEN** a signed-in visitor requests a page (fresh navigation, not a client-side route change)
- **THEN** the server-rendered HTML reflects the signed-in state (e.g. the header shows the account menu, not the sign-in entry point)

### Requirement: Sign out
The system SHALL allow a signed-in user to sign out, ending their session.

#### Scenario: Signing out
- **WHEN** a signed-in user activates sign out
- **THEN** their session ends and subsequent page loads treat them as signed out
