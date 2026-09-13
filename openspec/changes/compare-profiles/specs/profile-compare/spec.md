## Purpose

Lets a signed-in user compare their own reading and viewing progress, and which King works and adaptations they've read or watched, against another user's, side by side.

## ADDED Requirements

### Requirement: Comparing requires sign-in
The system SHALL only allow a signed-in user to view a profile comparison, redirecting a signed-out visitor to sign in instead of showing any comparison data.

#### Scenario: Signed-out visitor tries to compare
- **WHEN** a signed-out visitor navigates to a profile's compare route
- **THEN** they are not shown any comparison data and are directed to sign in

### Requirement: Compare route resolves the other profile by username
The system SHALL resolve the compare route's username to a profile the same way other profile routes do, showing an indication that no such profile exists when the username matches none.

#### Scenario: Comparing against a username that matches no profile
- **WHEN** a signed-in user navigates to a compare route for a username that matches no profile
- **THEN** they receive an indication that no such profile exists

### Requirement: A profile cannot be compared with itself
The system SHALL NOT show a comparison when the compare route's username resolves to the signed-in visitor's own profile, showing a message that a profile can't be compared with itself instead.

#### Scenario: Signed-in user navigates to their own compare route
- **WHEN** a signed-in user navigates to the compare route for their own username
- **THEN** they see a message that a profile can't be compared with itself, instead of any comparison data

### Requirement: Comparing against a private profile is blocked
The system SHALL show a "this profile is private" state, instead of comparison data, when the other username's profile is private and the signed-in visitor is not that profile's owner.

#### Scenario: Comparing against a private profile
- **WHEN** a signed-in visitor who does not own the other profile navigates to a compare route for a profile that is private
- **THEN** they see a "this profile is private" state instead of any comparison data

### Requirement: Reading-progress categories are compared as a two-bar chart per category
The system SHALL show, for each of the following categories, one chart containing a bar for the signed-in visitor and a bar for the other user, each in a distinct, consistent color across every category: Overall Bibliography, Bachman Books, Dark Tower, Collection, and Adaptations Watched. Each bar SHALL be labeled with that user's username and SHALL be direct-labeled with that user's raw count for the category (not a percentage). A count of zero SHALL still render a visible, minimal bar rather than no bar at all. Each category's progress SHALL be computed the same way as on the profile showcase (see profile-showcase capability).

#### Scenario: Viewing a valid comparison
- **WHEN** a signed-in user views a comparison against another public (or their own) profile
- **THEN** each of the five category charts shows a bar for each user, in the same two colors across every category, each labeled with that user's username and that user's raw count

#### Scenario: A user has a count of zero in a category
- **WHEN** a signed-in user or the other user has a count of zero in a given category
- **THEN** that user's bar in that category's chart is still visibly rendered (not absent), showing a count of 0

### Requirement: Progress-category card shows which side is ahead
The system SHALL show, on the same line as a progress-category card's title, a badge indicating which user has the higher count in that category, positioned at the end of that line opposite the title. When the signed-in visitor's count is higher, the badge SHALL use the `success` color, an upward arrow icon, and a label of `+` followed by the difference. When the signed-in visitor's count is lower, the badge SHALL use the `error` color, a downward arrow icon, and a label of the (negative) difference. The badge SHALL use the `subtle` variant in both cases. No badge SHALL be shown when the two counts are equal.

#### Scenario: Signed-in visitor is ahead in a category
- **WHEN** a progress-category chart shows the signed-in visitor with a higher count than the other user
- **THEN** that category's card shows a `success`-colored, `subtle`-variant badge with an upward arrow icon and a label of `+` followed by the difference

#### Scenario: Signed-in visitor is behind in a category
- **WHEN** a progress-category chart shows the signed-in visitor with a lower count than the other user
- **THEN** that category's card shows an `error`-colored, `subtle`-variant badge with a downward arrow icon and a label of the negative difference

#### Scenario: Both users are tied in a category
- **WHEN** a progress-category chart shows the signed-in visitor and the other user with equal counts
- **THEN** that category's card shows no difference badge

### Requirement: Progress-category charts are arranged in a responsive grid
The system SHALL arrange the five progress-category charts in a grid of 3 columns at large screen widths, 2 columns at medium screen widths, and 1 column at small screen widths.

#### Scenario: Viewing the progress-category grid on a large screen
- **WHEN** a comparison is viewed at a large screen width
- **THEN** the five progress-category charts are arranged 3 to a row

#### Scenario: Viewing the progress-category grid on a medium screen
- **WHEN** a comparison is viewed at a medium screen width
- **THEN** the five progress-category charts are arranged 2 to a row

#### Scenario: Viewing the progress-category grid on a small screen
- **WHEN** a comparison is viewed at a small screen width
- **THEN** the five progress-category charts are arranged 1 to a row

### Requirement: Read-books diff lists show what each side has read that the other hasn't
The system SHALL show two lists of King works: one listing works the signed-in visitor has marked read that the other user has not, and one listing works the other user has marked read that the signed-in visitor has not. Each list SHALL show an empty state when it has no entries.

#### Scenario: Both users have works the other hasn't read
- **WHEN** a comparison is shown between two users who have each read at least one King work the other hasn't
- **THEN** the signed-in visitor's list shows the works only they've read, and the other user's list shows the works only they've read

#### Scenario: One side has nothing the other side hasn't read
- **WHEN** a comparison is shown where every King work one user has read is also read by the other user
- **THEN** that user's list shows an empty state instead of any works

### Requirement: Watched-adaptations diff lists show what each side has watched that the other hasn't
The system SHALL show two lists of adaptations: one listing adaptations the signed-in visitor has marked watched that the other user has not, and one listing adaptations the other user has marked watched that the signed-in visitor has not. Each list SHALL show an empty state when it has no entries.

#### Scenario: Both users have adaptations the other hasn't watched
- **WHEN** a comparison is shown between two users who have each watched at least one adaptation the other hasn't
- **THEN** the signed-in visitor's list shows the adaptations only they've watched, and the other user's list shows the adaptations only they've watched

#### Scenario: One side has nothing the other side hasn't watched
- **WHEN** a comparison is shown where every adaptation one user has watched is also watched by the other user
- **THEN** that user's list shows an empty state instead of any adaptations

### Requirement: Diff list items link to their detail page
The system SHALL make each King work or adaptation shown in a diff list a link to that work's or adaptation's detail page.

#### Scenario: Following a diff list item
- **WHEN** a signed-in user selects a King work or adaptation shown in a diff list on a comparison
- **THEN** they are taken to that item's detail page

### Requirement: Diff-list blocks lay out side by side on large screens and stacked on small screens
The system SHALL lay out each diff-list pair (read-books, or watched-adaptations) as a two-sided row at large screen widths, switching to the signed-in visitor's side directly above the other user's side in a single column at small screen widths. Only one diff-list pair SHALL be laid out side-by-side at a time — the page SHALL NOT combine both diff-list pairs into one multi-column table. (The progress-category charts follow their own grid layout — see "Progress-category charts are arranged in a responsive grid" — not this row/column rule.)

#### Scenario: Viewing a diff-list pair on a large screen
- **WHEN** a comparison is viewed at a large screen width
- **THEN** each diff-list pair shows the signed-in visitor's side and the other user's side next to each other in a row

#### Scenario: Viewing a diff-list pair on a small screen
- **WHEN** a comparison is viewed at a small screen width
- **THEN** each diff-list pair shows the signed-in visitor's side directly above the other user's side in a single column
