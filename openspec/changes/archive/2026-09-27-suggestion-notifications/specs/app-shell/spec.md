## MODIFIED Requirements

### Requirement: Header displays site branding and primary navigation
The system SHALL render, on the leading side of the header, the site name "King Library", followed by a primary navigation menu with entries for Works, Short Stories, and Adaptations, each linking to its corresponding page. The system SHALL also render, on the trailing side of the header, an authentication entry point: a sign-in control when the visitor is signed out, or an account menu when the visitor is signed in. The account menu SHALL link to the profile page, the Read List page, the Watch List page, the `/following` page, the notification center page, and the account settings page, and SHALL offer a sign-out action. The account menu SHALL group these entries into sections separated by dividers: a profile-and-lists section (Profile, Read List, Watch List, Following), a notifications-and-settings section (Notifications, Settings), and a sign-out section (Sign out).

#### Scenario: Header navigation entries link to their pages
- **WHEN** a visitor selects a primary navigation entry (Works, Short Stories, or Adaptations) in the header
- **THEN** they are taken to that entry's corresponding page

#### Scenario: Signed-out visitor sees a sign-in entry point
- **WHEN** a signed-out visitor views the header
- **THEN** the header displays a sign-in control instead of an account menu

#### Scenario: Signed-in user sees an account menu
- **WHEN** a signed-in user views the header
- **THEN** the header displays an account menu instead of the sign-in control, offering links to the profile page, the Read List page, the Watch List page, the `/following` page, the notification center page, and the account settings page, plus a sign-out action

#### Scenario: Account menu's Following entry links to /following
- **WHEN** a signed-in user activates the "Following" entry in the account menu
- **THEN** they are taken to the `/following` page

#### Scenario: Account menu's Read List entry links to the Read List page
- **WHEN** a signed-in user activates the "Read List" entry in the account menu
- **THEN** they are taken to the Read List page

#### Scenario: Account menu's Watch List entry links to the Watch List page
- **WHEN** a signed-in user activates the "Watch List" entry in the account menu
- **THEN** they are taken to the Watch List page

#### Scenario: Account menu's Notifications entry links to the notification center
- **WHEN** a signed-in user activates the "Notifications" entry in the account menu
- **THEN** they are taken to the notification center page

#### Scenario: Account menu groups its entries into divided sections
- **WHEN** a signed-in user opens the account menu
- **THEN** its entries are shown in three sections separated by dividers: Profile/Read List/Watch List/Following, then Notifications/Settings, then Sign out

## ADDED Requirements

### Requirement: Account menu button indicates unread notifications
The system SHALL show a dot on the account menu button while the signed-in user has at least one unread notification. The Notifications entry in the account menu SHALL show the unread count. The indicator and count SHALL update live, without navigation or a page reload, when a notification is created for the signed-in user or when their notifications are marked read elsewhere (for example in another tab). As a fallback for a dropped live connection, they SHALL also be refreshed when the user signs in or out and on every page navigation. The indicator SHALL disappear once the user has viewed the notification center, without needing a page reload.

#### Scenario: User has unread notifications
- **WHEN** a signed-in user with one or more unread notifications views the header
- **THEN** the account menu button shows a dot, and the Notifications entry shows the unread count

#### Scenario: User has no unread notifications
- **WHEN** a signed-in user with no unread notifications views the header
- **THEN** the account menu button shows no dot

#### Scenario: Indicator clears after visiting the notification center
- **WHEN** a user with unread notifications opens the notification center
- **THEN** the dot on the account menu button disappears without a page reload

#### Scenario: New notification appears live
- **WHEN** a notification is created for a signed-in user while they have the app open on any page
- **THEN** the account menu button shows the dot and the Notifications entry shows the updated count, without the user navigating or reloading

#### Scenario: Reading notifications in another tab
- **WHEN** a user has the app open in two tabs and opens the notification center in one of them
- **THEN** the dot also disappears in the other tab without a reload

#### Scenario: Fallback refresh on navigation
- **WHEN** the live connection is unavailable and a notification is created for a signed-in user who then navigates to another page
- **THEN** the account menu button shows the dot
