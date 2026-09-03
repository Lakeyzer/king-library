# user-profile Specification

## Purpose

Gives a signed-in user a page to view their own account details, control whether their collections are publicly visible, and permanently delete their account.

## Requirements

### Requirement: Profile page requires sign-in
The system SHALL only allow a signed-in user to view the profile page, and SHALL require a username to be set (see the onboarding capability) before showing it.

#### Scenario: Signed-out visitor tries to view the profile page
- **WHEN** a signed-out visitor navigates to the profile page
- **THEN** they are not shown profile content and are directed to sign in

### Requirement: Profile page shows account details
The system SHALL display the signed-in user's own username and email on the profile page.

#### Scenario: Viewing account details
- **WHEN** a signed-in user with a username set navigates to the profile page
- **THEN** the page displays their username and email

### Requirement: Public/private visibility toggle
The system SHALL let a signed-in user toggle whether their collections (owned/wishlisted/read books, watched/watchlisted adaptations) are visible to other users, and SHALL apply a change immediately.

#### Scenario: Switching to private
- **WHEN** a signed-in user switches their visibility toggle from public to private on the profile page
- **THEN** their collections are no longer visible to other users

#### Scenario: Switching to public
- **WHEN** a signed-in user switches their visibility toggle from private to public on the profile page
- **THEN** their collections become visible to other users

### Requirement: Account deletion is permanent and irreversible
The system SHALL let a signed-in user permanently delete their own account, removing their authentication credentials and all associated data, and SHALL require an explicit confirmation step before doing so.

#### Scenario: Confirming account deletion
- **WHEN** a signed-in user activates "Delete account" on the profile page and confirms the action
- **THEN** their account and all associated data are permanently deleted, and they are signed out

#### Scenario: Backing out of account deletion
- **WHEN** a signed-in user activates "Delete account" but does not confirm
- **THEN** their account is not deleted and they remain signed in

#### Scenario: Deleted account cannot sign back in
- **WHEN** someone attempts to sign in with the credentials of a deleted account
- **THEN** the sign-in attempt fails as if the account never existed

### Requirement: Profile page shows linked sign-in identities
The system SHALL display, on the profile page, which sign-in identities (email/password, Google, Discord) are currently linked to the signed-in user's account.

#### Scenario: Viewing linked identities
- **WHEN** a signed-in user with a username set navigates to the profile page
- **THEN** the page lists each of their currently linked sign-in identities

### Requirement: Linking an additional OAuth sign-in method
The system SHALL let a signed-in user link an additional OAuth provider (Google or Discord) not already linked to their account, without signing them out or requiring a new sign-up.

#### Scenario: Linking a new provider
- **WHEN** a signed-in user activates "Link" for an OAuth provider not yet linked to their account
- **THEN** upon completing that provider's authorization flow, the provider is added to their linked identities and they remain signed in

### Requirement: Unlinking a sign-in method requires at least one remaining
The system SHALL let a signed-in user unlink one of their linked sign-in identities, provided at least one identity remains linked afterward, and SHALL prevent unlinking the last remaining identity.

#### Scenario: Unlinking one of several linked identities
- **WHEN** a signed-in user with more than one linked identity activates "Unlink" for one of them
- **THEN** that identity is removed and they can no longer sign in using it, while their other identities and access remain unaffected

#### Scenario: Attempting to unlink the only remaining identity
- **WHEN** a signed-in user with exactly one linked identity attempts to unlink it
- **THEN** the system prevents the unlink and the identity remains linked
