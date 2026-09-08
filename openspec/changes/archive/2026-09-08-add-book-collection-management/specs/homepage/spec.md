## MODIFIED Requirements

### Requirement: Stats card shows site-wide usage counts
The system SHALL display a single stats card with four counts: the total number of profiles in the system (counted regardless of each profile's public/private setting, since this is an aggregate usage count rather than a listing of any individual's data), the total number of `user_books` marked read, the total number of `user_books` marked owned, and the total number of `user_adaptations` marked watched.

#### Scenario: Viewing the stats card
- **WHEN** any visitor, signed in or signed out, views the homepage
- **THEN** the stats card shows the current total profile count, total books-read count, total books-owned count, and total adaptations-watched count

### Requirement: Homepage sections appear in a defined order
The system SHALL display, below the hero, a row of three catalog links spanning the full width (Works, Short Stories, and Adaptations, in that order), followed by two columns: a wider column containing (in this order) the Most Read Books, Currently Being Read, Most Watched Adaptations, and Least Watched Adaptations leaderboards, and a narrower column containing (in this order) the stats card, Book of the week, Book birthday, the Least read book spotlight, the Most wanted book spotlight, the Most anticipated adaptation spotlight, and (for a signed-in visitor, each only when an eligible recommendation exists) the personalized book recommendation, then the personalized owned-unread recommendation, then the personalized adaptation recommendation — followed below both columns by the Works closing CTA, then the Adaptations closing CTA. On a narrow (mobile-width) viewport, the system SHALL stack this content into a single column, with the narrower column's content appearing first, followed by the wider column's content, rather than omitting any of it.

#### Scenario: Section order
- **WHEN** a visitor scrolls down the homepage on a wide viewport
- **THEN** the full-width catalog links row appears below the hero, followed by the two columns side by side — the leaderboards column and, alongside it, the narrower column in its defined order, starting with the stats card — followed by the Works closing CTA and then the Adaptations closing CTA

#### Scenario: Section order on a narrow viewport
- **WHEN** a visitor scrolls down the homepage on a narrow (mobile-width) viewport
- **THEN** the full-width catalog links row appears first, then the narrower column's content (starting with the stats card), followed by the leaderboard content in its defined order, all stacked in a single column, still followed by the Works and Adaptations closing CTAs

## ADDED Requirements

### Requirement: Signed-in visitors see a personalized owned-unread book recommendation
The system SHALL show a signed-in visitor, in the narrower column, a recommendation for one King work they own but have not read. The system SHALL show nothing in its place when no such King work exists (rather than an empty state) and SHALL NOT show this recommendation to a signed-out visitor.

#### Scenario: Signed-in visitor with an eligible recommendation
- **WHEN** a signed-in visitor owns a King work they have not read
- **THEN** the homepage recommends one such King work

#### Scenario: Signed-in visitor with no eligible recommendation
- **WHEN** a signed-in visitor owns no King work they have not read
- **THEN** no owned-unread recommendation card is shown

#### Scenario: Signed-out visitor sees no owned-unread recommendation
- **WHEN** a signed-out visitor views the homepage
- **THEN** no owned-unread recommendation card is shown
