## ADDED Requirements

### Requirement: Profile page organizes content into three tabs behind a persistent header
The system SHALL present a profile as a persistent header (avatar, username, tagline, and the share-or-follow control) alongside three tabs — Reader Checklist, Read List, and Watch List — each a distinct, independently reachable route rather than client-only tab state. Reader Checklist SHALL show the dashboard content described elsewhere in this capability (reading progress, currently reading, reading timeline, bookshelf, recommendations) and SHALL be the tab shown when no other tab is specified. The header SHALL remain visible and unchanged while switching between tabs.

#### Scenario: Visiting a profile with no tab specified
- **WHEN** a visitor navigates to a profile's base URL (own or by username)
- **THEN** the header is shown along with the Reader Checklist tab's content

#### Scenario: Switching tabs keeps the header in place
- **WHEN** a visitor switches from one tab to another on a profile
- **THEN** the header (avatar, username, tagline, share-or-follow control) remains visible and unchanged, and only the tab content area updates

#### Scenario: Each tab is independently reachable
- **WHEN** a visitor navigates directly to a specific tab's URL
- **THEN** the header and that tab's content are shown, without needing to first visit the profile's base URL

### Requirement: Non-owner sees a gift-idea recommendation for a wanted-but-not-owned book
The system SHALL show a visitor who is not the profile's owner a recommendation for one King work that is on the profile owner's read list but not on their shelf (marked `want_to_read` but not marked `owned`), with the meta text "It's on their read list, but not their shelf." The system SHALL show nothing in its place when no such King work exists (rather than an empty state), and SHALL NOT show this recommendation to the profile owner viewing their own showcase.

#### Scenario: Non-owner visitor with an eligible gift idea
- **WHEN** a visitor who is not the profile owner views a public showcase for an owner who wants to read a King work they do not own
- **THEN** the showcase recommends one such King work as a gift idea, with the meta text "It's on their read list, but not their shelf"

#### Scenario: Non-owner visitor with no eligible gift idea
- **WHEN** a visitor who is not the profile owner views a public showcase for an owner with no King work that is wanted-to-read but not owned
- **THEN** no gift-idea recommendation card is shown

#### Scenario: Profile owner viewing their own showcase sees no gift-idea recommendation
- **WHEN** the profile owner views their own showcase
- **THEN** no gift-idea recommendation card is shown, regardless of which King works they've read or own
