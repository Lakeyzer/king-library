## MODIFIED Requirements

### Requirement: Header displays site branding and primary navigation
The system SHALL render, on the leading side of the header, the site name "King Library", followed by a primary navigation menu with entries for Works, Short Stories, and Adaptations, each linking to its corresponding page. The system SHALL also render, on the trailing side of the header, an authentication entry point: a sign-in control when the visitor is signed out, or an account menu when the visitor is signed in. The account menu SHALL link to the profile page, the Read List page, the Watch List page, the `/following` page, and the account settings page, and SHALL offer a sign-out action. The account menu SHALL group these entries into sections separated by dividers: a profile-and-lists section (Profile, Read List, Watch List, Following), a settings section (Settings), and a sign-out section (Sign out).

#### Scenario: Header navigation entries link to their pages
- **WHEN** a visitor selects a primary navigation entry (Works, Short Stories, or Adaptations) in the header
- **THEN** they are taken to that entry's corresponding page

#### Scenario: Signed-out visitor sees a sign-in entry point
- **WHEN** a signed-out visitor views the header
- **THEN** the header displays a sign-in control instead of an account menu

#### Scenario: Signed-in user sees an account menu
- **WHEN** a signed-in user views the header
- **THEN** the header displays an account menu instead of the sign-in control, offering links to the profile page, the Read List page, the Watch List page, the `/following` page, and the account settings page, plus a sign-out action

#### Scenario: Account menu's Following entry links to /following
- **WHEN** a signed-in user activates the "Following" entry in the account menu
- **THEN** they are taken to the `/following` page

#### Scenario: Account menu's Read List entry links to the Read List page
- **WHEN** a signed-in user activates the "Read List" entry in the account menu
- **THEN** they are taken to the Read List page

#### Scenario: Account menu's Watch List entry links to the Watch List page
- **WHEN** a signed-in user activates the "Watch List" entry in the account menu
- **THEN** they are taken to the Watch List page

#### Scenario: Account menu groups its entries into divided sections
- **WHEN** a signed-in user opens the account menu
- **THEN** its entries are shown in three sections separated by dividers: Profile/Read List/Watch List/Following, then Settings, then Sign out
