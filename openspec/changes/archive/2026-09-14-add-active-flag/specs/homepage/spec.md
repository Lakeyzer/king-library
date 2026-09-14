## MODIFIED Requirements

### Requirement: Catalog links row shows totals and links to each browsing page
The system SHALL display three catalog links, each showing a total count and linking to a browsing page: the total number of active King works linking to the works browsing page, the total number of King short stories linking to the short stories browsing page, and the total number of active adaptations linking to the adaptations browsing page.

#### Scenario: Viewing the catalog links
- **WHEN** any visitor views the homepage
- **THEN** the catalog links row shows the current total count of active King works, King short stories, and active adaptations

#### Scenario: Following a catalog link
- **WHEN** a visitor selects one of the catalog links
- **THEN** they are taken to that catalog's browsing page

### Requirement: Stats card shows site-wide usage counts
The system SHALL display a single stats card with four counts: the total number of profiles in the system (counted regardless of each profile's public/private setting, since this is an aggregate usage count rather than a listing of any individual's data), the total number of `user_books` marked read against an active King work, the total number of `user_books` marked owned against an active King work, and the total number of `user_adaptations` marked watched against an active adaptation.

#### Scenario: Viewing the stats card
- **WHEN** any visitor, signed in or signed out, views the homepage
- **THEN** the stats card shows the current total profile count, total books-read count, total books-owned count, and total adaptations-watched count, each counting only rows tied to an active King work or active adaptation

#### Scenario: A book or adaptation becomes inactive
- **WHEN** a King work or adaptation with existing `user_books`/`user_adaptations` rows is marked inactive
- **THEN** those rows no longer contribute to the stats card's counts

### Requirement: Book of the week rotates on a deterministic weekly schedule
The system SHALL feature exactly one active King work as "Book of the week," selected as the active work whose shuffle position is the nth-lowest among active works' shuffle positions, where n is the current ISO week number modulo the total number of active King works, so the same work is featured for every visitor throughout a given ISO week and the featured work changes deterministically from week to week with no manually maintained schedule. Inactive works SHALL never be selected and SHALL NOT count toward the total used in the rotation.

#### Scenario: Same book featured throughout the week
- **WHEN** two visitors view the homepage on different days within the same ISO week
- **THEN** they see the same King work featured as Book of the week

#### Scenario: Selecting the book of the week
- **WHEN** a visitor selects the Book of the week feature
- **THEN** they are taken to that work's detail page

#### Scenario: An inactive work is never featured
- **WHEN** the Book of the week rotation is computed
- **THEN** no King work with an active flag of false is eligible to be chosen

### Requirement: Book birthday highlights works published on this calendar day
The system SHALL display every active King work whose original publish date's month and day match the current date, and SHALL display an empty state when no active King work matches today's date.

#### Scenario: One work matches today's date
- **WHEN** exactly one active King work's original publish month and day match today
- **THEN** the homepage displays that work as today's book birthday

#### Scenario: Multiple works match today's date
- **WHEN** more than one active King work's original publish month and day match today
- **THEN** the homepage displays all of them

#### Scenario: No work matches today's date
- **WHEN** no active King work's original publish month and day match today
- **THEN** the homepage displays an empty state for book birthday instead of any work

#### Scenario: Only an inactive work matches today's date
- **WHEN** the only King work whose original publish month and day match today has an active flag of false
- **THEN** the homepage displays an empty state for book birthday instead of that work

### Requirement: Most read books leaderboard
The system SHALL display the top 5 active King works ranked by count of `user_books` rows marked read, descending.

#### Scenario: Viewing the most read leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 active King works ordered from highest to lowest read count

#### Scenario: An inactive work is excluded from the leaderboard
- **WHEN** a King work with a high read count is marked inactive
- **THEN** it no longer appears in the most read leaderboard, regardless of its read count

### Requirement: Currently reading leaderboard
The system SHALL display the top 5 active King works ranked by count of `user_books` rows currently marked currently-reading, descending — a ranking of works, not a single aggregate total.

#### Scenario: Viewing the currently-reading leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 active King works ordered from highest to lowest currently-reading count

#### Scenario: An inactive work is excluded from the leaderboard
- **WHEN** a King work with a high currently-reading count is marked inactive
- **THEN** it no longer appears in the currently-reading leaderboard

### Requirement: Least read book spotlights an under-read release
The system SHALL feature the active, released King work (excluding any work whose original publish date is in the future) with the lowest count of `user_books` rows marked read, breaking ties consistently so the same work is chosen on every page load rather than varying unpredictably. A signed-in visitor who has already read the featured work SHALL see their read state reflected instead of a prompt; any other visitor, including a signed-out one, SHALL see a prompt to start reading it.

#### Scenario: Unreleased works are excluded
- **WHEN** the least-read book is selected
- **THEN** no King work with a future original publish date is eligible to be chosen

#### Scenario: Inactive works are excluded
- **WHEN** the least-read book is selected
- **THEN** no King work with an active flag of false is eligible to be chosen

#### Scenario: Signed-out visitor sees a generic prompt
- **WHEN** a signed-out visitor views the least-read book feature
- **THEN** they see a generic prompt to start reading it

#### Scenario: Signed-in visitor who has not read it sees a prompt
- **WHEN** a signed-in visitor who has not read the featured least-read book views it
- **THEN** they see a prompt to start reading it

#### Scenario: Signed-in visitor who has already read it sees their read state
- **WHEN** a signed-in visitor who has already read the featured least-read book views it
- **THEN** they see their read state instead of a start-reading prompt

### Requirement: Most wanted book spotlight
The system SHALL feature the active King work with the highest count of `user_books` rows marked want-to-read, breaking ties consistently so the same work is chosen on every page load rather than varying unpredictably.

#### Scenario: Viewing the most wanted spotlight
- **WHEN** any visitor views the homepage
- **THEN** the homepage features the active King work with the highest want-to-read count

#### Scenario: An inactive work is excluded
- **WHEN** the most wanted book is selected and the King work with the highest want-to-read count has an active flag of false
- **THEN** that work is not eligible and the next-highest active King work is featured instead

### Requirement: Most watched adaptations leaderboard
The system SHALL display the top 5 active adaptations ranked by count of `user_adaptations` rows marked watched, descending.

#### Scenario: Viewing the most watched leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 active adaptations ordered from highest to lowest watched count

#### Scenario: An inactive adaptation is excluded from the leaderboard
- **WHEN** an adaptation with a high watched count is marked inactive
- **THEN** it no longer appears in the most watched leaderboard

### Requirement: Least watched adaptations leaderboard
The system SHALL display the 5 active adaptations with the lowest count of `user_adaptations` rows marked watched, ascending.

#### Scenario: Viewing the least watched leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 active adaptations ordered from lowest to highest watched count

#### Scenario: An inactive adaptation is excluded from the leaderboard
- **WHEN** an adaptation with a low watched count is marked inactive
- **THEN** it no longer appears in the least watched leaderboard

### Requirement: Most anticipated adaptation spotlight
The system SHALL feature the active adaptation with the highest count of `user_adaptations` rows marked want-to-watch, breaking ties consistently so the same adaptation is chosen on every page load rather than varying unpredictably.

#### Scenario: Viewing the most anticipated spotlight
- **WHEN** any visitor views the homepage
- **THEN** the homepage features the active adaptation with the highest want-to-watch count

#### Scenario: An inactive adaptation is excluded
- **WHEN** the most anticipated adaptation is selected and the adaptation with the highest want-to-watch count has an active flag of false
- **THEN** that adaptation is not eligible and the next-highest active adaptation is featured instead

### Requirement: Signed-in visitors see a personalized book recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one active King work they have not read whose active adaptation they have watched, naming that adaptation as the reason for the recommendation. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor has watched an active adaptation whose active source King work they have not read
- **THEN** the homepage recommends that King work, naming the adaptation they watched as the reason

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor has no watched active adaptation with an unread active source King work
- **THEN** no recommendation card is shown

#### Scenario: Signed-out visitor sees no book recommendation
- **WHEN** a signed-out visitor views the homepage
- **THEN** no book recommendation card is shown

#### Scenario: Source work or watched adaptation is inactive
- **WHEN** a signed-in visitor has watched an adaptation that is now inactive, or the adaptation's source King work is now inactive
- **THEN** that pairing is not eligible for this recommendation

### Requirement: Signed-in visitors see a personalized owned-unread book recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one active King work they own but have not read. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor owns an active King work they have not read
- **THEN** the homepage recommends one such King work

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor owns no active King work they have not read
- **THEN** no owned-unread recommendation card is shown

#### Scenario: Signed-out visitor sees no owned-unread recommendation
- **WHEN** a signed-out visitor views the homepage
- **THEN** no owned-unread recommendation card is shown

### Requirement: Signed-in visitors see a personalized adaptation recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one active adaptation they have not watched whose active source King work they have read, naming that source work as the reason for the recommendation. The system SHALL show nothing in its place when no such adaptation exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor has read an active King work whose active adaptation they have not watched
- **THEN** the homepage recommends one such adaptation, naming the King work they read as the reason

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor has no read active King work with an unwatched active adaptation
- **THEN** no recommendation card is shown

#### Scenario: Signed-out visitor sees no adaptation recommendation
- **WHEN** a signed-out visitor views the homepage
- **THEN** no recommendation card is shown

#### Scenario: Candidate adaptation or its source work is inactive
- **WHEN** an adaptation eligible for this recommendation, or its source King work, is now inactive
- **THEN** that pairing is not eligible for this recommendation
