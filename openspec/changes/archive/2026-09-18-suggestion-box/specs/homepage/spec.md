## MODIFIED Requirements

### Requirement: Homepage sections appear in a defined order
The system SHALL display, below the hero, a row of three catalog links spanning the full width (Works, Short Stories, and Adaptations, in that order), followed by two columns: a wider column containing (in this order) the Most Read Books, Currently Being Read, Most Watched Adaptations, and Least Watched Adaptations leaderboards, and a narrower column containing (in this order) the stats card, the Suggestion Box link card, Book of the week, Book birthday, the Least read book spotlight, the Most wanted book spotlight, the Most anticipated adaptation spotlight, and (for a signed-in visitor, each only when an eligible recommendation exists) the personalized book recommendation, then the personalized owned-unread recommendation, then the personalized adaptation recommendation — followed below both columns by the Works closing CTA, then the Adaptations closing CTA. On a narrow (mobile-width) viewport, the system SHALL stack this content into a single column, with the narrower column's content appearing first, followed by the wider column's content, rather than omitting any of it.

#### Scenario: Section order
- **WHEN** a visitor scrolls down the homepage on a wide viewport
- **THEN** the full-width catalog links row appears below the hero, followed by the two columns side by side — the leaderboards column and, alongside it, the narrower column in its defined order, starting with the stats card and the Suggestion Box link card — followed by the Works closing CTA and then the Adaptations closing CTA

#### Scenario: Section order on a narrow viewport
- **WHEN** a visitor scrolls down the homepage on a narrow (mobile-width) viewport
- **THEN** the full-width catalog links row appears first, then the narrower column's content (starting with the stats card and the Suggestion Box link card), followed by the leaderboard content in its defined order, all stacked in a single column, still followed by the Works and Adaptations closing CTAs

## ADDED Requirements

### Requirement: Homepage links to the Suggestion Box
The system SHALL display, in the narrower column, a small card with an icon, a title, and a description inviting visitors to vote on suggestions, linking to the Suggestion Box page. The system SHALL show this card to every visitor, signed in or signed out.

#### Scenario: Viewing the Suggestion Box card
- **WHEN** any visitor views the homepage
- **THEN** they see a card with an icon, a title, and a description inviting them to vote on suggestions

#### Scenario: Following the Suggestion Box card
- **WHEN** a visitor selects the Suggestion Box card
- **THEN** they are taken toward the Suggestion Box page, subject to that page's own sign-in requirement
