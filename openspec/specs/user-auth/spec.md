# user-auth Specification

## Purpose

Lets a visitor create an account and sign in, via email+password or a third-party OAuth provider, so that user-specific features (collections, wishlists, profiles) have an authenticated identity to attach to.

## Requirements

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

### Requirement: Signing in leaves the visitor on the page they intended to be on
The system SHALL, after a successful sign-in, leave the visitor on the page they were trying to reach - not on the homepage as an incidental side effect of how sign-in works. This covers two distinct cases: a signed-out visitor bounced to the homepage because they navigated to a page that requires sign-in (the auth modal SHALL open there automatically, and successful sign-in SHALL return them to the originally requested page), and a visitor who opens the auth modal from any other page (successful sign-in SHALL leave them on that same page). Email+password sign-in never navigates away from the current page in the first place, so it satisfies this by doing nothing extra; OAuth sign-in always makes a full round trip through the provider and back, so it satisfies this by explicitly returning to wherever it was started from (the bounced-to-homepage destination when that applies, otherwise the page the modal was opened from).

#### Scenario: Auth modal opens automatically after being bounced
- **WHEN** a signed-out visitor is redirected to the homepage after navigating to a page that requires sign-in
- **THEN** the auth modal opens without the visitor needing to activate the sign-in entry point themselves

#### Scenario: Signing in with email and password after being bounced returns to the original page
- **WHEN** a signed-out visitor who was redirected here from a page that requires sign-in signs in with email and password
- **THEN** they are navigated to the page they originally requested

#### Scenario: Signing in with an OAuth provider after being bounced returns to the original page
- **WHEN** a signed-out visitor who was redirected here from a page that requires sign-in signs in with an OAuth provider
- **THEN** they are navigated to the page they originally requested once the provider's authorization flow completes

#### Scenario: A new sign-up still completes onboarding first
- **WHEN** a signed-out visitor who was redirected here from a page that requires sign-in instead creates a new account
- **THEN** they are sent to onboarding as usual, not directly to the originally requested page

#### Scenario: Signing in with email and password with no pending redirect stays on the current page
- **WHEN** a visitor activates the header's sign-in entry point on a page that does not require sign-in and signs in with email and password
- **THEN** they remain on that page, with no navigation

#### Scenario: Signing in with an OAuth provider with no pending redirect returns to the current page
- **WHEN** a visitor activates the header's sign-in entry point on a page that does not require sign-in and signs in with an OAuth provider
- **THEN** once the provider's authorization flow completes, they are returned to that same page

### Requirement: Session works correctly under server-side rendering
The system SHALL make the signed-in/signed-out state available during server-side rendering, so that a page's initial render (not just a client-side hydration pass) reflects whether the visitor is authenticated.

#### Scenario: Requesting a page while already signed in
- **WHEN** a signed-in visitor requests a page (fresh navigation, not a client-side route change)
- **THEN** the server-rendered HTML reflects the signed-in state (e.g. the header shows the account menu, not the sign-in entry point)

### Requirement: Sign out
The system SHALL allow a signed-in user to sign out, ending their session, and SHALL show a farewell message reading "Long days and pleasant nights" (the Gilead greeting from the Dark Tower series) as part of signing out. If signing out happens while the user is on a page that requires sign-in, the system SHALL navigate them away from it immediately, without waiting for a subsequent navigation.

#### Scenario: Signing out
- **WHEN** a signed-in user activates sign out
- **THEN** their session ends and subsequent page loads treat them as signed out

#### Scenario: Farewell message on sign out
- **WHEN** a signed-in user activates sign out
- **THEN** the message "Long days and pleasant nights" is shown

#### Scenario: Signing out on a page that requires sign-in
- **WHEN** a signed-in user activates sign out while on a page that requires sign-in (e.g. their own profile)
- **THEN** they are navigated away from that page immediately

#### Scenario: Signing out on a page that doesn't require sign-in
- **WHEN** a signed-in user activates sign out while on a page that doesn't require sign-in
- **THEN** they remain on that page

### Requirement: Personal reading/watch/collection status refreshes on sign-in or sign-out without a page reload
The system SHALL update every already-rendered reading-status, watch-status, ownership, and edition control to reflect the new signed-in/signed-out state immediately when sign-in or sign-out happens, without requiring the visitor to reload or navigate to a new page.

#### Scenario: Signing out clears personal status from the current page
- **WHEN** a signed-in user signs out while viewing a page showing their own reading, watch, or ownership status (e.g. a work they've marked read)
- **THEN** that status is no longer shown, without the page being reloaded

#### Scenario: Signing in on a page populates personal status without a reload
- **WHEN** a signed-out visitor signs in while viewing a page that would show their reading, watch, or ownership status
- **THEN** that status appears, without the page being reloaded
