## ADDED Requirements

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

### Requirement: Linking email/password as a sign-in method
The system SHALL let a signed-in user who does not yet have an email/password identity linked add one from the account settings page, collected via a modal (email and password fields) rather than a redirect flow, without signing them out or requiring a new sign-up.

#### Scenario: Linking email/password from an OAuth-only account
- **WHEN** a signed-in user with no email/password identity linked opens the "Link email/password" modal and submits a valid email and password
- **THEN** an email/password identity is added to their account, it appears among their linked identities, and they remain signed in

#### Scenario: Email/password already linked
- **WHEN** a signed-in user already has an email/password identity linked
- **THEN** the settings page shows it among their linked identities rather than offering to link it again

## MODIFIED Requirements

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
