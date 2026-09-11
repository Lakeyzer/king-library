# user-profile Specification

## Purpose

Gives a signed-in user a page to view their own account details, control whether their collections are publicly visible, and permanently delete their account.

## Requirements

### Requirement: Profile page requires sign-in
The system SHALL only allow a signed-in user to view the account settings page, and SHALL require a username to be set (see the onboarding capability) before showing it.

#### Scenario: Signed-out visitor tries to view the profile page
- **WHEN** a signed-out visitor navigates to the account settings page
- **THEN** they are not shown account settings content and are directed to sign in

### Requirement: Profile page shows account details
The system SHALL display the signed-in user's own username and email on the account settings page.

#### Scenario: Viewing account details
- **WHEN** a signed-in user with a username set navigates to the account settings page
- **THEN** the page displays their username and email

### Requirement: Public/private visibility toggle
The system SHALL let a signed-in user toggle whether their collections (owned/wishlisted/read books, watched/watchlisted adaptations) are visible to other users, and SHALL apply a change immediately.

#### Scenario: Switching to private
- **WHEN** a signed-in user switches their visibility toggle from public to private on the account settings page
- **THEN** their collections are no longer visible to other users

#### Scenario: Switching to public
- **WHEN** a signed-in user switches their visibility toggle from private to public on the account settings page
- **THEN** their collections become visible to other users

### Requirement: Account deletion is permanent and irreversible
The system SHALL let a signed-in user permanently delete their own account, removing their authentication credentials and all associated data, and SHALL require an explicit confirmation step before doing so. The confirmation step SHALL be presented in a modal dialog, which SHALL display the text "Go then, there are other apps than these." alongside the confirmation control.

#### Scenario: Confirming account deletion
- **WHEN** a signed-in user activates "Delete account" on the account settings page and confirms the action
- **THEN** their account and all associated data are permanently deleted, and they are signed out

#### Scenario: Backing out of account deletion
- **WHEN** a signed-in user activates "Delete account" but does not confirm
- **THEN** their account is not deleted and they remain signed in

#### Scenario: Deleted account cannot sign back in
- **WHEN** someone attempts to sign in with the credentials of a deleted account
- **THEN** the sign-in attempt fails as if the account never existed

#### Scenario: Delete confirmation modal shows the quote
- **WHEN** a signed-in user activates "Delete account" on the account settings page
- **THEN** a modal opens containing the confirmation control and the text "Go then, there are other apps than these."

### Requirement: Profile avatar upload
The system SHALL let a signed-in user upload a small image as their profile avatar from the account settings page, storing it in Supabase Storage, and SHALL display the uploaded avatar on the account settings page and on their profile Showcase in place of the default placeholder. The system SHALL reject an upload that exceeds the configured size/type limits, leaving the previously set avatar (if any) unchanged.

#### Scenario: Uploading a first avatar
- **WHEN** a signed-in user with no avatar set uploads a valid small image on the account settings page
- **THEN** the image is stored and shown as their avatar on both the settings page and their Showcase

#### Scenario: Replacing an existing avatar
- **WHEN** a signed-in user with an avatar already set uploads a new valid image
- **THEN** the new image replaces the previous one everywhere the avatar is shown

#### Scenario: Rejecting an oversized or unsupported file
- **WHEN** a signed-in user attempts to upload a file that exceeds the configured size limit or is not a supported image type
- **THEN** the system rejects the upload, displays an error, and leaves any existing avatar unchanged

### Requirement: Profile tagline
The system SHALL let a signed-in user set an optional tagline of at most 50 characters from the account settings page, and SHALL reject a tagline that exceeds that length.

#### Scenario: Setting a tagline within the limit
- **WHEN** a signed-in user submits a tagline of 50 characters or fewer on the account settings page
- **THEN** the tagline is saved to their profile

#### Scenario: Rejecting a tagline over the limit
- **WHEN** a signed-in user submits a tagline longer than 50 characters
- **THEN** the system rejects the submission and displays an error without saving it

#### Scenario: Clearing a previously set tagline
- **WHEN** a signed-in user with a tagline set clears the field and saves
- **THEN** their profile's tagline is removed

### Requirement: Profile page shows linked sign-in identities
The system SHALL display, on the account settings page, which sign-in identities (email/password, Google, Discord) are currently linked to the signed-in user's account.

#### Scenario: Viewing linked identities
- **WHEN** a signed-in user with a username set navigates to the account settings page
- **THEN** the page lists each of their currently linked sign-in identities

### Requirement: Linking an additional OAuth sign-in method
The system SHALL let a signed-in user link an additional OAuth provider (Google or Discord) not already linked to their account, without signing them out or requiring a new sign-up.

#### Scenario: Linking a new provider
- **WHEN** a signed-in user activates "Link" for an OAuth provider not yet linked to their account
- **THEN** upon completing that provider's authorization flow, the provider is added to their linked identities and they remain signed in

### Requirement: Linking email/password as a sign-in method
The system SHALL let a signed-in user who does not yet have an email/password identity linked add one from the account settings page, via a modal that collects a password (the account's existing email is shown for reference, not entered) rather than a redirect flow, without signing them out or requiring a new sign-up.

#### Scenario: Linking email/password from an OAuth-only account
- **WHEN** a signed-in user with no email/password identity linked opens the "Link email/password" modal and submits a valid password
- **THEN** an email/password identity is added to their account, it appears among their linked identities, and they remain signed in

#### Scenario: Email/password already linked
- **WHEN** a signed-in user already has an email/password identity linked
- **THEN** the settings page shows it among their linked identities rather than offering to link it again

### Requirement: Unlinking a sign-in method requires at least one remaining
The system SHALL let a signed-in user unlink one of their linked sign-in identities, provided at least one identity remains linked afterward, and SHALL prevent unlinking the last remaining identity.

#### Scenario: Unlinking one of several linked identities
- **WHEN** a signed-in user with more than one linked identity activates "Unlink" for one of them
- **THEN** that identity is removed and they can no longer sign in using it, while their other identities and access remain unaffected

#### Scenario: Attempting to unlink the only remaining identity
- **WHEN** a signed-in user with exactly one linked identity attempts to unlink it
- **THEN** the system prevents the unlink and the identity remains linked
