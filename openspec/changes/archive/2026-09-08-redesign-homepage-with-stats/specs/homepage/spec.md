## MODIFIED Requirements

### Requirement: Homepage presents an introductory hero
The system SHALL display, at the top of the homepage, a horizontal hero with the app title "King Library" and a short description (covering building a bookshelf and tracking reading progress) on the leading side, and an auth-aware call to action on the trailing side: a prompt to start tracking reading progress when the visitor is signed out, or a prompt to add to their collection when the visitor is signed in.

#### Scenario: Visiting the homepage
- **WHEN** a signed-out visitor navigates to the homepage
- **THEN** the hero displays the title and description on the leading side and a CTA prompting them to start tracking their reading progress on the trailing side

#### Scenario: Signed-in visitor sees an add-to-collection CTA
- **WHEN** a signed-in visitor navigates to the homepage
- **THEN** the hero displays the title and description on the leading side and a CTA prompting them to add to their collection on the trailing side

### Requirement: Homepage highlights the Works section
The system SHALL display, after the stats-and-suggestions area, a closing call to action introducing the Works area and linking to the works browsing page.

#### Scenario: Following the Works section link
- **WHEN** a visitor selects the Works closing CTA on the homepage
- **THEN** they are taken to the works browsing page

### Requirement: Homepage highlights the Adaptations section
The system SHALL display, after the Works closing CTA, a closing call to action introducing the Adaptations area and linking to the adaptations browsing page.

#### Scenario: Following the Adaptations section link
- **WHEN** a visitor selects the Adaptations closing CTA on the homepage
- **THEN** they are taken to the adaptations browsing page

### Requirement: Homepage sections appear in a defined order
The system SHALL display, below the hero, a row of three catalog links spanning the full width (Works, Short Stories, and Adaptations, in that order), followed by two columns: a wider column containing (in this order) the Most Read Books, Currently Being Read, Most Watched Adaptations, and Least Watched Adaptations leaderboards, and a narrower column containing (in this order) the stats card, Book of the week, Book birthday, the Least read book spotlight, the Most wanted book spotlight, the Most anticipated adaptation spotlight, and (for a signed-in visitor, each only when an eligible recommendation exists) the personalized book recommendation followed by the personalized adaptation recommendation — followed below both columns by the Works closing CTA, then the Adaptations closing CTA. On a narrow (mobile-width) viewport, the system SHALL stack this content into a single column, with the narrower column's content appearing first, followed by the wider column's content, rather than omitting any of it.

#### Scenario: Section order
- **WHEN** a visitor scrolls down the homepage on a wide viewport
- **THEN** the full-width catalog links row appears below the hero, followed by the two columns side by side — the leaderboards column and, alongside it, the narrower column in its defined order, starting with the stats card — followed by the Works closing CTA and then the Adaptations closing CTA

#### Scenario: Section order on a narrow viewport
- **WHEN** a visitor scrolls down the homepage on a narrow (mobile-width) viewport
- **THEN** the full-width catalog links row appears first, then the narrower column's content (starting with the stats card), followed by the leaderboard content in its defined order, all stacked in a single column, still followed by the Works and Adaptations closing CTAs

## REMOVED Requirements

### Requirement: Homepage highlights the Short Stories section
**Reason**: The redesigned homepage has no dedicated stats, leaderboard, or spotlight source for Short Stories, so the full descriptive intro/CTA section (title, description, and browse button, as still used for Works and Adaptations) is dropped. Short Stories keeps a minimal presence via the catalog links row (see "Catalog links row shows totals and links to each browsing page").
**Migration**: Short Stories remains reachable via the header's primary navigation (per `app-shell`) and via its catalog link on the homepage.

## ADDED Requirements

### Requirement: Stats card shows site-wide usage counts
The system SHALL display a single stats card with three counts: the total number of profiles in the system (counted regardless of each profile's public/private setting, since this is an aggregate usage count rather than a listing of any individual's data), the total number of `user_books` marked read, and the total number of `user_adaptations` marked watched.

#### Scenario: Viewing the stats card
- **WHEN** any visitor, signed in or signed out, views the homepage
- **THEN** the stats card shows the current total profile count, total books-read count, and total adaptations-watched count

### Requirement: Book of the week rotates on a deterministic weekly schedule
The system SHALL feature exactly one King work as "Book of the week," selected as the work whose shuffle position equals the current ISO week number modulo the total number of King works, so the same work is featured for every visitor throughout a given ISO week and the featured work changes deterministically from week to week with no manually maintained schedule.

#### Scenario: Same book featured throughout the week
- **WHEN** two visitors view the homepage on different days within the same ISO week
- **THEN** they see the same King work featured as Book of the week

#### Scenario: Selecting the book of the week
- **WHEN** a visitor selects the Book of the week feature
- **THEN** they are taken to that work's detail page

### Requirement: Book birthday highlights works published on this calendar day
The system SHALL display every King work whose original publish date's month and day match the current date, and SHALL display an empty state when no King work matches today's date.

#### Scenario: One work matches today's date
- **WHEN** exactly one King work's original publish month and day match today
- **THEN** the homepage displays that work as today's book birthday

#### Scenario: Multiple works match today's date
- **WHEN** more than one King work's original publish month and day match today
- **THEN** the homepage displays all of them

#### Scenario: No work matches today's date
- **WHEN** no King work's original publish month and day match today
- **THEN** the homepage displays an empty state for book birthday instead of any work

### Requirement: Most read books leaderboard
The system SHALL display the top 5 King works ranked by count of `user_books` rows marked read, descending.

#### Scenario: Viewing the most read leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 King works ordered from highest to lowest read count

### Requirement: Currently reading leaderboard
The system SHALL display the top 5 King works ranked by count of `user_books` rows currently marked currently-reading, descending — a ranking of works, not a single aggregate total.

#### Scenario: Viewing the currently-reading leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 King works ordered from highest to lowest currently-reading count

### Requirement: Least read book spotlights an under-read release
The system SHALL feature the released King work (excluding any work whose original publish date is in the future) with the lowest count of `user_books` rows marked read, breaking ties consistently so the same work is chosen on every page load rather than varying unpredictably. A signed-in visitor who has already read the featured work SHALL see their read state reflected instead of a prompt; any other visitor, including a signed-out one, SHALL see a prompt to start reading it.

#### Scenario: Unreleased works are excluded
- **WHEN** the least-read book is selected
- **THEN** no King work with a future original publish date is eligible to be chosen

#### Scenario: Signed-out visitor sees a generic prompt
- **WHEN** a signed-out visitor views the least-read book feature
- **THEN** they see a generic prompt to start reading it

#### Scenario: Signed-in visitor who has not read it sees a prompt
- **WHEN** a signed-in visitor who has not read the featured least-read book views it
- **THEN** they see a prompt to start reading it

#### Scenario: Signed-in visitor who has already read it sees their read state
- **WHEN** a signed-in visitor who has already read the featured least-read book views it
- **THEN** they see their read state instead of a start-reading prompt

### Requirement: Most watched adaptations leaderboard
The system SHALL display the top 5 adaptations ranked by count of `user_adaptations` rows marked watched, descending.

#### Scenario: Viewing the most watched leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 adaptations ordered from highest to lowest watched count

### Requirement: Least watched adaptations leaderboard
The system SHALL display the 5 adaptations with the lowest count of `user_adaptations` rows marked watched, ascending.

#### Scenario: Viewing the least watched leaderboard
- **WHEN** any visitor views the homepage
- **THEN** the homepage displays up to 5 adaptations ordered from lowest to highest watched count

### Requirement: Most wanted book spotlight
The system SHALL feature the King work with the highest count of `user_books` rows marked want-to-read, breaking ties consistently so the same work is chosen on every page load rather than varying unpredictably.

#### Scenario: Viewing the most wanted spotlight
- **WHEN** any visitor views the homepage
- **THEN** the homepage features the King work with the highest want-to-read count

### Requirement: Most anticipated adaptation spotlight
The system SHALL feature the adaptation with the highest count of `user_adaptations` rows marked want-to-watch, breaking ties consistently so the same adaptation is chosen on every page load rather than varying unpredictably.

#### Scenario: Viewing the most anticipated spotlight
- **WHEN** any visitor views the homepage
- **THEN** the homepage features the adaptation with the highest want-to-watch count

### Requirement: Signed-in visitors see a personalized book recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one King work they have not read whose adaptation they have watched, naming that adaptation as the reason for the recommendation. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor has watched an adaptation whose source King work they have not read
- **THEN** the homepage recommends that King work, naming the adaptation they watched as the reason

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor has no watched adaptation with an unread source King work
- **THEN** no recommendation card is shown

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor views the homepage
- **THEN** no recommendation card is shown

### Requirement: Signed-in visitors see a personalized adaptation recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one adaptation they have not watched whose source King work they have read, naming that source work as the reason for the recommendation. The system SHALL show nothing in its place when no such adaptation exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor has read a King work whose adaptation they have not watched
- **THEN** the homepage recommends one such adaptation, naming the King work they read as the reason

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor has no read King work with an unwatched adaptation
- **THEN** no recommendation card is shown

#### Scenario: Signed-out visitor
- **WHEN** a signed-out visitor views the homepage
- **THEN** no recommendation card is shown

### Requirement: Catalog links row shows totals and links to each browsing page
The system SHALL display three catalog links, each showing a total count and linking to a browsing page: the total number of King works linking to the works browsing page, the total number of King short stories linking to the short stories browsing page, and the total number of adaptations linking to the adaptations browsing page.

#### Scenario: Viewing the catalog links
- **WHEN** any visitor views the homepage
- **THEN** the catalog links row shows the current total count of King works, King short stories, and adaptations

#### Scenario: Following a catalog link
- **WHEN** a visitor selects one of the catalog links
- **THEN** they are taken to that catalog's browsing page
